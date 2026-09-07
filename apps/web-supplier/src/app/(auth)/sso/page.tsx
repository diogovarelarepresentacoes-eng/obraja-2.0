'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setSupplierToken } from '@/lib/api';

function SSOHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const to = params.get('to') ?? '/dashboard';

    if (token) {
      setSupplierToken(token);
      router.replace(to);
    } else {
      router.replace('/login');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Redirecionando...</p>
    </div>
  );
}

export default function SSOPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    }>
      <SSOHandler />
    </Suspense>
  );
}
