import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Real-Time Communication Platform | Admin Panel',
  description: 'A powerful real-time communication platform with WebSocket support for Flutter, Laravel, and web applications.',
  keywords: ['real-time', 'socket.io', 'communication', 'admin panel'],
  authors: [{ name: 'Your Company' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourapp.com',
    title: 'Real-Time Communication Platform',
    description: 'A powerful real-time communication platform with WebSocket support',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-black text-white antialiased">
        <div className="min-h-screen overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}