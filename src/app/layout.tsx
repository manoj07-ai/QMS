import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Pharma Complaint AI — Quality Assurance Module',
  description:
    'Pharma Complaint AI: AI-powered customer complaint management system for pharmaceutical manufacturing. API & FDF Quality Assurance Module with intelligent complaint intake, risk assessment, and LangGraph-powered analysis.',
  keywords: ['pharma', 'QMS', 'complaint management', 'quality assurance', 'API', 'FDF', 'Pharma Complaint AI'],
  authors: [{ name: 'Pharma Complaint AI Platform' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
