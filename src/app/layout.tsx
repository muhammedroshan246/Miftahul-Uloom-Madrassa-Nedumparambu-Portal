
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mifthahul Uloom Higher Secondary Madrassa | Official Portal & ERP',
  description: 'A premier center of authentic Islamic knowledge integrated with high-caliber modern higher secondary education.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col antialiased text-slate-900 bg-[#fbfbf8]">
        {children}
      </body>
    </html>
  );
}
