'use client';

import { useState } from 'react';

interface GalleryImage { url: string; alt?: string; isPrimary: boolean; sortOrder: number; }

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [active, setActive] = useState(sorted.find((i) => i.isPrimary) ?? sorted[0]);

  return (
    <div className="space-y-3">
      <div
        className="aspect-square bg-white rounded-[20px] overflow-hidden"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
      >
        {active ? (
          <img src={active.url} alt={active.alt ?? name} className="w-full h-full object-contain p-4" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(img)}
              className="w-16 h-16 flex-shrink-0 rounded-[12px] overflow-hidden transition-all"
              style={{
                boxShadow: active?.url === img.url
                  ? `0 0 0 2px #E8622C`
                  : '0 2px 8px rgba(0,0,0,0.08)',
                opacity: active?.url === img.url ? 1 : 0.6,
              }}
            >
              <img src={img.url} alt={img.alt ?? `Imagem ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
