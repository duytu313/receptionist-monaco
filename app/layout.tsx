import './globals.css';
import AuthStatus from '../components/AuthStatus';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
};

export const metadata = {};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-gray-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
