import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeaderOS — Hệ điều hành quản trị cá nhân',
  description: 'Hệ thống capture thông tin, quản lý việc/dự án và hỗ trợ ra quyết định cho Engineering Leader',
};

import { AuthProvider } from '@/contexts/auth-context';
import { I18nProvider } from '@/contexts/i18n-context';
import { ThemeProvider } from '@/components/theme/theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
