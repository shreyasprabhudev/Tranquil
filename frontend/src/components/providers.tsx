'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster as SonnerToaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SonnerToaster position="top-right" />
    </AuthProvider>
  );
}

export { toast } from 'sonner';
