'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import DarkModeToggle, { DarkModeTogglePlain } from './DarkModeToggle';
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Github,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dispatch, useContext } from 'react';
import context, { Action } from '@/context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import ChatThreadList from '@/components/ChatHistory';

const SidebarCollapsed = ({
  dispatch,
}: {
  dispatch: Dispatch<Action> | undefined;
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link href="/">
            <div className="flex-shrink-0 hover:opacity-50 mt-4">
              <Image
                className="not-prose"
                src="/sensei.svg"
                alt="logo"
                width={32}
                height={32}
              />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="shadow-none">
          Sensei
        </TooltipContent>
      </Tooltip>
      <nav className="flex-1 mt-10 flex flex-col items-center justify-between mb-4">
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
            <TooltipContent side="bottom" className="shadow-none">
              New Thread
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <div className="w-10 h-10 rounded-full bg-offset filter brightness-95 text-foreground/70 hover:opacity-50 mb-4">
            <DarkModeToggle />
          </div>
          <Link
            href="https://github.com/jjleng/sensei"
            className={`flex items-center justify-center w-10 h-10 rounded-full bg-offset filter brightness-95 text-foreground/70 hover:opacity-50 mb-8`}
            target="_blank"
          >
            <Github />
          </Link>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  dispatch!({ type: 'TOGGLE_SIDEBAR' });
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-offset filter brightness-95 text-foreground/70 hover:opacity-50"
              >
                <ArrowRightFromLine />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="shadow-none">
              Expand
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
};

export const SidebarExpanded = ({
  dispatch,
}: {
  dispatch: Dispatch<Action> | undefined;
}) => {
  const router = useRouter();
  return (
    <TooltipProvider>
      <div className="flex justify-between items-center w-full px-3 pb-3 pt-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href="/">
              <div className="flex-shrink-0 hover:opacity-50">
                <Image
                  className="not-prose"
                  src="/sensei.svg"
                  alt="logo"
                  width={32}
                  height={32}
                />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="shadow-none">
            Sensei
          </TooltipContent>
        </Tooltip>
        <Button
          onClick={() => {
            router.push('/');
          }}
          size="sm"
          variant="outline"
          className="bg-offset filter brightness-95"
        >
          <Plus size={20} className="mr-2" />
          New Thread
        </Button>
      </div>
      <ChatThreadList />
      <div className="flex justify-between py-3 w-full px-3">
        <div className="flex">
          <div className="hover:opacity-50 cursor-pointer mr-2">
            <DarkModeTogglePlain size={20} />
          </div>
          <Link
            href="https://github.com/jjleng/sensei"
            className={`flex items-center justify-center text-foreground/70 hover:opacity-50`}
            target="_blank"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fill-rule="evenodd"
                d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z"
                clip-rule="evenodd"
              />
            </svg>
          </Link>
        </div>
        <button
          onClick={() => {
            dispatch!({ type: 'TOGGLE_SIDEBAR' });
          }}
          className="text-foreground/70 hover:opacity-50"
        >
          <ArrowLeftFromLine size={20} />
        </button>
      </div>
    </TooltipProvider>
  );
};

const Sidebar = () => {
  const { isSidebarOpen, dispatch } = useContext(context);

  return (
    <div
      className={cn(
        'hidden fixed top-0 left-0 w-0 sm:flex flex-col items-center bg-accent dark:bg-accent h-screen prose dark:prose-invert',
        isSidebarOpen
          ? 'sm:w-[var(--sidebar-width-expanded)]'
          : 'sm:w-[var(--sidebar-width-collapsed)]'
      )}
    >
      {!isSidebarOpen ? (
        <SidebarCollapsed dispatch={dispatch} />
      ) : (
        <SidebarExpanded dispatch={dispatch} />
      )}
    </div>
  );
};

export default Sidebar;
