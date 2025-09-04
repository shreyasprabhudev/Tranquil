import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Providers } from '@/components/providers';
import { AnimatedBackground } from '@/components/ui/animated-background';

// Font configuration
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tranquil - Your Peaceful Journaling Companion',
  description: 'A serene space for reflection with AI-powered insights to nurture your mental wellbeing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800',
        'antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300',
        'relative overflow-x-hidden'
      )}>
        <AnimatedBackground />
        <Providers>
          <div className="min-h-screen flex flex-col relative z-10">
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            
            <footer className="border-t border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-6">
              <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                  <p className="text-center text-sm leading-loose text-slate-500 dark:text-slate-400 md:text-left font-poppins">
                    Built for the Palo Alto Networks Team :D
                  </p>
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400 md:text-right font-poppins">
                    {new Date().getFullYear()} Tranquil. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}