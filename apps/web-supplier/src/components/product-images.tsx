'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface Props {
  productId: string;
  initial: ProductImage[];
}

export function ProductImagesEditor({ productId, initial }: Props) {
  const [images, setImages] = useState<ProductImage[]>(initial);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const img = await api.upload<ProductImage>(`/products/${productId}/images`, file);
        setImages((prev) => [...prev, img]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm('Remover esta imagem?')) return;
    try {
      await api.delete(`/products/${productId}/images/${imageId}`);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover');
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      const updated = await api.patch<ProductImage[]>(`/products/${productId}/images/${imageId}/primary`, {});
      setImages(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro');
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Imagens do produto</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : '+ Adicionar'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {images.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 transition-colors"
        >
          <p className="text-3xl mb-2">🖼️</p>
          <p className="text-sm text-gray-500">Clique para adicionar imagens</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WEBP · máx 10 MB</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden">
              <img
                src={img.url}
                alt=""
                className={`w-full aspect-square object-cover ${img.isPrimary ? 'ring-2 ring-orange-500' : ''}`}
              />
              {img.isPrimary && (
                <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  Principal
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    className="text-[11px] bg-white text-gray-900 font-semibold px-2.5 py-1 rounded-full hover:bg-orange-50"
                  >
                    Tornar principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="text-[11px] bg-red-500 text-white font-semibold px-2.5 py-1 rounded-full hover:bg-red-600"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 transition-colors text-gray-400"
          >
            <span className="text-2xl">+</span>
            <span className="text-xs mt-1">Adicionar</span>
          </div>
        </div>
      )}
    </section>
  );
}
