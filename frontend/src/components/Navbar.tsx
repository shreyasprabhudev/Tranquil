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
import { LogOut, User, Home, BookOpen, BarChart2 } from 'lucide-react';
import { toast } from './providers';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Insights', href: '/insights', icon: BarChart2 },
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
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Tranquil</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 rounded-full"
              >
                <User className="h-4 w-4" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
