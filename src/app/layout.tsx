import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

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
        <main style={{ paddingBottom: '70px' }}>
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
