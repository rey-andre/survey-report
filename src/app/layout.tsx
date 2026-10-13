import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Survey Report & Risk Grading — Property Risk Management',
  description: 'Aplikasi Internal Web Pengelolaan Survey Risiko Properti, Risk Engineering, dan Underwriting Decision.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  );
}
