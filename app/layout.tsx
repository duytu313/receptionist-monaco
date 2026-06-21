import './globals.css';
import AuthStatus from '../components/AuthStatus';

export const metadata = {
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

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
