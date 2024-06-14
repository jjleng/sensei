/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { WebSource } from '../../types';

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

export default function WebSourceCard(props: WebSource) {
  const url = new URL(props.url);
  const domain = url.hostname;
  return (
    <div className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md md:w-auto transition-colors cursor-pointer h-full">
      <p className="text-sm text-text-light dark:text-text-dark line-clamp-2">
        {props.title}
      </p>
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

export function WebSourceMoreCard({ webSources }: { webSources: WebSource[] }) {
  // Get at most 5 web sources
  const sources = webSources.slice(0, 5);
  return (
    <div className="p-2 flex flex-col items-start justify-between bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md md:w-auto transition-colors cursor-pointer">
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
  );
}
