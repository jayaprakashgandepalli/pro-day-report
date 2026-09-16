import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Day Report',
  description: 'Lead Management Application for Sri Vaatsalya Educational Institutions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
