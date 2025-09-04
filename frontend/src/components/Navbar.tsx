'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, MessageSquare, BookOpen, Sparkles } from 'lucide-react';
import { toast } from './providers';
import { motion } from 'framer-motion';

const navItems = [
  { 
    name: 'Chat', 
    href: '/chat', 
    icon: MessageSquare,
    description: 'Have a conversation with your AI companion'
  },
  { 
    name: 'Journal', 
    href: '/journal', 
    icon: BookOpen,
    description: 'Reflect on your thoughts and feelings'
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Failed to log out');
    }
  };

  if (!user) return null;

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full',
      'border-b border-slate-200/50 dark:border-slate-700/30',
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
      'transition-all duration-300',
      'shadow-sm'
    )}>
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-6 w-6 text-blue-500 group-hover:text-blue-600 transition-colors" />
            </motion.div>
            <motion.span 
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              Tranquil
            </motion.span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className="relative group"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-10 px-4 font-medium transition-all duration-200',
                        'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400',
                        isActive 
                          ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' 
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50',
                        'group relative overflow-hidden'
                      )}
                    >
                      <Icon className={cn(
                        'h-4 w-4 mr-2 transition-transform duration-200',
                        isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'
                      )} />
                      {item.name}
                      {isActive && (
                        <motion.div 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                          layoutId="activeNav"
                          initial={false}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30
                          }}
                        />
                      )}
                    </Button>
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {item.description}
                      <div className="absolute left-1/2 -top-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900"></div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'h-10 px-3 rounded-full border border-transparent',
                  'hover:bg-slate-100 dark:hover:bg-slate-800',
                  'transition-all duration-200',
                  'relative overflow-hidden group',
                  'flex items-center space-x-2'
                )}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                  animate={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <User className="h-4 w-4 text-slate-700 dark:text-slate-300 relative z-10" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 relative z-10">
                  Hi {user?.username?.split(' ')[0] || 'User'}!
                </span>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg"
              sideOffset={10}
            >
              <DropdownMenuItem 
                onClick={handleLogout}
                className="px-3 py-2.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors duration-150 text-red-600 dark:text-red-400 flex items-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
