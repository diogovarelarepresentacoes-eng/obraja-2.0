import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', weight: ['800'] });

export const metadata: Metadata = {
  title: {
    default: 'ObraJá — Materiais de Construção',
    template: '%s | ObraJá',
  },
  description: 'O maior marketplace de materiais de construção civil do Brasil.',
  keywords: ['construção civil', 'materiais de construção', 'cimento', 'tijolo', 'obra'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${montserrat.variable} ${inter.className}`}>
          <AuthProvider>{children}</AuthProvider>
        </body>
    </html>
  );
}
