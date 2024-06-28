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

const Sidebar = () => {
  return (
    <div className="fixed top-0 left-0 w-[var(--sidebar-width)] flex flex-col items-center bg-accent dark:bg-accent/70 py-4 h-screen">
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-plus"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-github"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </Link>
          </div>
        </nav>
      </TooltipProvider>
    </div>
  );
};

export default Sidebar;
