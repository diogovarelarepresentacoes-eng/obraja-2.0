'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/aprovacoes', label: 'Aprovações', icon: '✅' },
  { href: '/fornecedores', label: 'Fornecedores', icon: '🏪' },
  { href: '/usuarios', label: 'Usuários', icon: '👥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearAdminToken();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold" style={{ color: '#F05A28' }}>ObraJá</span>
          <span className="text-xs text-gray-400 ml-1 font-medium">Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={active ? { backgroundColor: '#F05A28' } : {}}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
