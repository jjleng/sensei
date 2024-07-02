import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from 'react';
import { useRouter } from 'next/navigation';
import { produce } from 'immer';
import moment from 'moment';
import ChatThreadStore, { ChatThreadEntry } from '@/ChatThreadStore';
import context from '@/context';
import { cn } from '@/lib/utils';

interface GroupedThreads {
  date: string; // This will store local date strings for display
  threads: ChatThreadEntry[];
}

const ChatThreadList: React.FC = () => {
  const { reloadSidebarCounter, sidebarActiveItem, dispatch } =
    useContext(context);
  const [groupedThreads, setGroupedThreads] = useState<GroupedThreads[]>([]);
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);
  const hasMoreData = useRef(true);
  const router = useRouter();

  let activeItemSlug = sidebarActiveItem;
  if (!activeItemSlug) {
    // First item in the list
    activeItemSlug = ChatThreadStore.fetchEntries(0)[0]?.slug || null;
  }

  const groupByDate = useCallback(
    (threads: ChatThreadEntry[]): GroupedThreads[] => {
      const groups: { [key: string]: ChatThreadEntry[] } = {};

      threads.forEach((thread) => {
        const localDate = moment.utc(thread.ts).toDate().toLocaleDateString(); // Convert to local date string
        if (!groups[localDate]) {
          groups[localDate] = [];
        }
        groups[localDate].push(thread);
      });

      return Object.keys(groups).map((date) => ({
        date,
        threads: groups[date],
      }));
    },
    []
  );

  const mergeThreads = useCallback(
    (newThreads: ChatThreadEntry[], prepend = false) => {
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

        // Merge new grouped threads with existing grouped threads using immer
        return produce(prevGroupedThreads, (draft) => {
          uniqueNewGroupedThreads.forEach((newGroup) => {
            const existingGroupIndex = draft.findIndex(
              (group) => group.date === newGroup.date
            );
            if (existingGroupIndex !== -1) {
              if (prepend) {
                draft[existingGroupIndex].threads.unshift(...newGroup.threads);
              } else {
                draft[existingGroupIndex].threads.push(...newGroup.threads);
              }
            } else {
              if (prepend) {
                draft.unshift(newGroup);
              } else {
                draft.push(newGroup);
              }
            }
          });
        });
      });
    },
    [groupByDate]
  );

  const loadThreads = useCallback(
    async (page: number) => {
      if (isFetching.current || !hasMoreData.current) return;
      isFetching.current = true;
      const newThreads = ChatThreadStore.fetchEntries(page);
      if (newThreads.length === 0) {
        hasMoreData.current = false;
        isFetching.current = false;
        return; // No more threads to load
      }

      mergeThreads(newThreads);
      isFetching.current = false;
    },
    [mergeThreads]
  );

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

  const reloadSidebar = useCallback(() => {
    const allEntries = ChatThreadStore.getAllEntries();
    const firstEntryTs = groupedThreads[0]?.threads[0]?.ts;
    const newEntries = allEntries.filter(
      (entry) => firstEntryTs && new Date(entry.ts) > new Date(firstEntryTs)
    );
    mergeThreads(newEntries, true);
  }, [groupedThreads, mergeThreads]);

  useEffect(() => {
    reloadSidebar();
  }, [reloadSidebarCounter, reloadSidebar]);

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
      className="h-full overflow-y-auto overflow-x-hidden px-0 w-full"
    >
      {groupedThreads.map((group) => (
        <div key={group.date} className="mb-4">
          <div className="sticky top-0 text-gray-400 text-sm py-1 ml-2 bg-accent dark:bg-accent">
            {group.date}
          </div>
          {group.threads.map((thread) => (
            <div
              onClick={() => {
                if (thread.slug === activeItemSlug) return;

                dispatch?.({
                  type: 'SET_SIDEBAR_ACTIVE_ITEM',
                  payload: thread.slug,
                });
                // Also jump to the thread page
                router.push(`/search/${thread.slug}`);
              }}
              key={thread.id}
              className={cn(
                'p-2 hover:bg-background dark:hover:bg-background/50  transition-colors duration-200 ease-in-out',
                thread.slug === activeItemSlug
                  ? 'bg-background dark:bg-background/50'
                  : 'cursor-pointer'
              )}
            >
              <div className="truncate">{thread.displayName}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ChatThreadList;
