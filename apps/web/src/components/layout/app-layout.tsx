'use client';

import { ReactNode } from 'react';
import { RouteGuard } from '@/components/auth/route-guard';
import { AppSidebar } from './app-sidebar';
import { TopHeader } from './top-header';
import { ChatbotWidget } from '@/components/ai/chatbot-widget';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-150 flex flex-col md:flex-row">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader />
          <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
      <ChatbotWidget />
    </RouteGuard>
  );
}
