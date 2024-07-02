import React, { useEffect, useState, useRef, useCallback } from 'react';
import ChatThreadStore, { ChatThreadEntry } from '@/ChatThreadStore';

interface GroupedThreads {
  date: string;
  threads: ChatThreadEntry[];
}

const ChatThreadList: React.FC = () => {
  const [groupedThreads, setGroupedThreads] = useState<GroupedThreads[]>([]);
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);
  const hasMoreData = useRef(true);

  const groupByDate = (threads: ChatThreadEntry[]): GroupedThreads[] => {
    const groups: { [key: string]: ChatThreadEntry[] } = {};

    threads.forEach((thread) => {
      const date = new Date(thread.ts).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(thread);
    });

    return Object.keys(groups).map((date) => ({
      date,
      threads: groups[date],
    }));
  };

  const loadThreads = useCallback(async (page: number) => {
    if (isFetching.current || !hasMoreData.current) return;
    isFetching.current = true;
    const newThreads = ChatThreadStore.fetchEntries(page);
    if (newThreads.length === 0) {
      hasMoreData.current = false;
      isFetching.current = false;
      return; // No more threads to load
    }

    const newGroupedThreads = groupByDate(newThreads);

    setGroupedThreads((prevGroupedThreads) => {
      const existingThreadIds = new Set(
        prevGroupedThreads.flatMap((group) =>
          group.threads.map((thread) => thread.id)
        )
      );
      const uniqueNewThreads = newThreads.filter(
        (thread) => !existingThreadIds.has(thread.id)
      );
      const uniqueNewGroupedThreads = groupByDate(uniqueNewThreads);

      // Merge new grouped threads with existing grouped threads
      const mergedThreads = [...prevGroupedThreads];
      uniqueNewGroupedThreads.forEach((newGroup) => {
        const existingGroupIndex = mergedThreads.findIndex(
          (group) => group.date === newGroup.date
        );
        if (existingGroupIndex !== -1) {
          mergedThreads[existingGroupIndex].threads.push(...newGroup.threads);
        } else {
          mergedThreads.push(newGroup);
        }
      });

      return mergedThreads;
    });

    isFetching.current = false;
  }, []);

  const initialLoad = useCallback(async () => {
    let currentPage = 0;
    while (
      containerRef.current &&
      containerRef.current.scrollHeight <= containerRef.current.clientHeight
    ) {
      await loadThreads(currentPage);
      if (!hasMoreData.current) break; // Break if no more data is available
      currentPage += 1;
    }
    setPage(currentPage);
  }, [loadThreads]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setPage((prevPage) => prevPage + 1);
      }
    }
  }, []);

  useEffect(() => {
    loadThreads(page);
  }, [page, loadThreads]);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden px-4 w-full"
    >
      {groupedThreads.map((group) => (
        <div key={group.date} className="mb-4">
          <div className="sticky top-0 text-gray-400 text-sm py-1 bg-accent dark:bg-accent">
            {group.date}
          </div>
          {group.threads.map((thread) => (
            <div key={thread.id} className="mb-2">
              <div className="truncate">{thread.displayName}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ChatThreadList;
