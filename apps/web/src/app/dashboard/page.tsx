'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { DashboardCockpit } from '@/components/dashboard/dashboard-cockpit';

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardCockpit />
    </AppLayout>
  );
}
