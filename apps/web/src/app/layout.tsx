import type { Metadata } from 'next';
import { AppShell } from '../components/AppShell';
import { MobileGate } from '../components/MobileGate';
import { SidebarProvider } from '../components/SidebarContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synt — Autonomous SOC Analyst',
  description: 'Synt investigates Splunk alerts autonomously and hands you a finished case file.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-app-bg text-white antialiased">
        <MobileGate />
        <div className="hidden lg:block">
          <SidebarProvider>
            <AppShell>{children}</AppShell>
          </SidebarProvider>
        </div>
      </body>
    </html>
  );
}
