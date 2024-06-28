'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import DarkModeToggle from './DarkModeToggle';
import { Github, Plus } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="hidden fixed top-0 left-0 w-0 sm:w-[var(--sidebar-width)] sm:flex flex-col items-center bg-accent dark:bg-accent/70 py-4 h-screen">
      <div className="flex-shrink-0 mb-4">
        <Image src="/sensei.svg" alt="logo" width={32} height={32} />
      </div>
      <TooltipProvider>
        <nav className="flex-1 mt-10 flex flex-col items-center justify-between">
          <div>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={`flex items-center justify-center w-10 h-10 rounded-full bg-offset filter brightness-95 text-foreground/70 hover:opacity-50 mb-8`}
                >
                  <Plus />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">New Thread</TooltipContent>
            </Tooltip>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-offset filter brightness-95 text-foreground/70 hover:opacity-50 mb-4">
              <DarkModeToggle />
            </div>
            <Link
              href="https://github.com/jjleng/sensei"
              className={`flex items-center justify-center w-10 h-10 rounded-full bg-offset filter brightness-95 text-foreground/70 hover:opacity-50`}
              target="_blank"
            >
              <Github />
            </Link>
          </div>
        </nav>
      </TooltipProvider>
    </div>
  );
};

export default Sidebar;
