import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/globals.css';
import { Providers } from '@/providers';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import Sidebar from '@/components/Sidebar';
import { MainLayout } from '@/components/MainLayout';

const inter = Inter({ subsets: ['latin'] });

const title = 'Sensei';
const description = 'Knowledge discovery with Sensei AI';

export const metadata: Metadata = {
  metadataBase: new URL('https://heysensei.app/'),
  title,
  description,
  icons: {
    icon: [{ rel: 'icon', url: './favicon.ico', type: 'image/x-icon' }],
  },
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    creator: '@jijun_l',
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
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <div className="h-screen">
              <Navbar />
              <Sidebar />
              <MainLayout>{children}</MainLayout>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
