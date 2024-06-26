/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { WebSource } from '@/types';
import {
  HoverCardContent,
  HoverCard,
  HoverCardTrigger,
} from '@/components/ui/HoverCard';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import Link from 'next/link';

function extractMainDomain(hostname: string): string | null {
  try {
    const domainPattern = /(?<=^|\.)([^.]+)\.[^.]+$/;

    const match = hostname.match(domainPattern);

    if (match) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

function WebSourceCardContent(props: WebSource & { index: number }) {
  const url = new URL(props.url);
  const domain = url.hostname;
  return (
    <div className="p-2 bg-accent hover:bg-input dark:hover:bg-accent/50 rounded-md md:w-auto transition-colors cursor-pointer h-full">
      <div className="text-sm text-text-light dark:text-text-dark line-clamp-2">
        {props.title}
      </div>
      <div className="flex items-center mt-2 w-full">
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}`}
          alt="Source logo"
          className="rounded-full flex-shrink-0"
          width={16}
          height={16}
        />
        <div className="flex items-center ml-2 w-full overflow-hidden">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 w-full truncate">
            <span className="truncate">{extractMainDomain(domain)}</span>
            <span className="ml-1 flex-shrink-0">•</span>
            <span className="ml-1 flex-shrink-0">{props.index}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebSourceCard(props: WebSource & { index: number }) {
  const url = new URL(props.url);
  const domain = url.hostname;
  return (
    <HoverCard openDelay={10} closeDelay={100} open={false}>
      <HoverCardTrigger asChild>
        <WebSourceCardContent {...props} />
      </HoverCardTrigger>
      <HoverCardContent className="shadow-none">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}`}
              alt="Source logo"
              className="rounded-full flex-shrink-0"
              width={16}
              height={16}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {extractMainDomain(domain)}
            </div>
          </div>
          <a
            href={props.url}
            className="block mb-2 text-medium font-medium hover:underline"
            target="_blank"
          >
            <span className="line-clamp-2">{props.title}</span>
          </a>
          <div className="text-sm text-foreground/80 line-clamp-4">
            {props.content}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function WebSourceMoreCard({
  webSources,
}: {
  webSources: Array<WebSource & { index: number }>;
}) {
  // Get at most 5 web sources
  const sources = webSources.slice(0, 5);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="p-2 flex flex-col items-start justify-between bg-accent hover:bg-input dark:hover:bg-accent/50 rounded-md md:w-auto transition-colors cursor-pointer w-full h-full">
          <div className="flex items-center space-x-2">
            {sources.map((source) => (
              <div
                key={source.url}
                className="flex items-center justify-center rounded-full text-xs font-bold text-green-700"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${
                    new URL(source.url).hostname
                  }`}
                  alt="Source logo"
                  className="rounded-full"
                  width={16}
                  height={16}
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {`View ${webSources.length} more`}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mt-0 text-xl font-medium">{`${sources.length} Sources`}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        {sources.map((source) => (
          <Link key={source.url} href={source.url} target="_blank">
            <WebSourceCardContent {...source} />
          </Link>
        ))}
      </DialogContent>
    </Dialog>
  );
}
