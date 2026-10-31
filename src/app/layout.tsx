import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Day Report',
  description: 'Lead Management Application for Sri Vaatsalya Educational Institutions',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <main>
          {children}
        </main>
        {process.env.NODE_ENV === 'production' ? (
          <Script id="sw-register" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `}
          </Script>
        ) : (
          <Script id="sw-unregister" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
