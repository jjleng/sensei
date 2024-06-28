import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/globals.css';
import { Providers } from '@/providers';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sensei Search',
  description: 'Search with Sensei AI',
  icons: {
    icon: [{ rel: 'icon', url: './favicon.ico', type: 'image/x-icon' }],
  },
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="h-screen">
              <Sidebar />
              <div className="ml-[var(--sidebar-width)]">{children}</div>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
