'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/Drawer';
import { Separator } from '@/components/ui/Separator';
import { Github, Menu, Plus } from 'lucide-react';
import { DarkModeTogglePlain } from './DarkModeToggle';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <nav className="border-b sm:hidden fixed top-0 left-0 w-full bg-background h-[var(--navbar-height)]">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 md:px-0 flex items-center space-x-2">
        <div className="flex items-center py-3">
          <Image src="/sensei.svg" alt="logo" width={28} height={28} />
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="flex flex-col p-4 py-6 text-foreground/70">
              <DrawerClose>
                <div
                  className="flex space-x-2 items-center"
                  onClick={() => {
                    router.push('/');
                  }}
                >
                  <Plus size={20} />
                  <span className="text-lg">New Thread</span>
                </div>
              </DrawerClose>
              <Separator className="my-4" />
              <DrawerClose>
                <div
                  className="flex space-x-2 items-center"
                  onClick={toggleTheme}
                >
                  <DarkModeTogglePlain size={20} />
                  <span className="text-lg">
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
              </DrawerClose>
              <Separator className="my-4" />
              <DrawerClose>
                <Link href="https://github.com/jjleng/sensei" target="_blank">
                  <div className="flex space-x-2 items-center">
                    <Github size={20} />
                    <span className="text-lg">Github</span>
                  </div>
                </Link>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
