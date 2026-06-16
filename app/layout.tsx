import './globals.css';
import AuthStatus from '../components/AuthStatus';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <header className="p-4 border-b">
          <AuthStatus />
        </header>
        {children}
      </body>
    </html>
  );
}
