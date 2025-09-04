'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ConversationProvider } from '@/contexts/ConversationContext';
import { Toaster as SonnerToaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConversationProvider>
        {children}
      </ConversationProvider>
      <SonnerToaster position="top-right" />
    </AuthProvider>
  );
}

export { toast } from 'sonner';
