import type { Metadata } from 'next';
import './globals.css';
import { ContextProvider } from '@/components/ContextProvider';

export const metadata: Metadata = {
  title: 'Chainacy',
  description: 'A decentralized platform for releasing encrypted messages at a scheduled time',
  keywords: 'blockchain, encryption, PGP, scheduled messages, decentralized',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2b2a32" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" 
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --font-orbitron: 'Orbitron', monospace;
            }
          `
        }} />
      </head>
      <body className="">
        <ContextProvider>
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
