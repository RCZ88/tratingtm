import type { ReactNode } from 'react';
import { TeachersSubnav } from '@/components/admin/TeachersSubnav';

export default function AdminTeachersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl">
      <TeachersSubnav />
      {children}
    </div>
  );
}
