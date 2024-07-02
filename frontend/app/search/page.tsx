'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  Suspense,
} from 'react';
import { produce } from 'immer';
import { useSearchParams, useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/Separator';
import SearchInput from '@/components/SearchInput';
import ChatHistoryItem from '@/components/ChatHistoryItem';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { WebSource, MediumImage, MediumVideo, MetaData } from '@/types';
import Context from '@/context';
import { ListPlus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatThreadStore from '@/ChatThreadStore';

// Query and Answer
interface QA {
  // uuid, unique for each query. This is used to identify the query in the thread.
  // Ideally, server should return the query ID in the response. So that client can match the query with the response.
  // But for now, this is not the case.
  id: string;
  // User's query/question
  query: string;
  // Sensei's answer to the query
  answer: string | null;
  // Web sources from the search results
  webSources: WebSource[] | null;
  // Mediums including images and videos from the search results
  mediums: (MediumImage | MediumVideo)[] | null;
  // Extra data, such as if the answer potentially has math formulas
  metadata: MetaData | null;
}

export function SearchComponent(props: { threadId: string; slug?: string }) {
  const router = useRouter();

  // Conversation thread ID
  // Here, we generate a new thread ID for each page refresh. If the thread ID doesn't exist, server will crate a new thread.
  // Client could also choose to send in an existing thread ID to continue the conversation.
  // Ideally, the thread ID should be generated on the server and sent to the client. But for now, this is not the case.
  const threadId = useRef(props.threadId);

  // Store the websocket
  const socketRef = useRef<Socket | null>(null);

  // If the search is in progress
  const [processing, setProcessing] = useState(false);
  // QA thread is a list of QA objects. Each QA object represents a query and its response along with the search results.
  const [qaThread, setQAThread] = useState<QA[]>([]);
  // Current query is stored in the context.
  const { currentQuery, isSidebarOpen, dispatch } = useContext(Context);

  // Store the last processed query's UUID, so that we don't process the same query multiple times.
  // React might re-render the component multiple times for the same query.
  const lastQueryIdRef = useRef<string | null>(null);

  // Reference to the end of the list. This is used to scroll to the end of the list when a new QA is updated and/or added.
  const endOfList = useRef<HTMLDivElement>(null);

  // Related questions
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);

  const { addToast } = useToast();

  // TODO: instead of the client side fetching, move this to a server component
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SOCKET_HOST!}/threads/${threadId.current}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch the thread');
        }

        const { thread_id, chat_history, metadata } = await response.json();
        const updatedResult = chat_history.map(
          ({ web_results, ...rest }: any) => ({
            webSources: web_results,
            ...rest,
          })
        );
        setQAThread(
          produce((draft) => {
            const existingIds = new Set(draft.map((item) => item.id));
            const uniqueResults = updatedResult.filter(
              (result: any) => !existingIds.has(result.id)
            );
            draft.unshift(...uniqueResults);
          })
        );
        setRelatedQuestions(metadata.related_questions);
      } catch (error) {
        addToast('Failed to fetch the thread', 'error');
      }
    };

    // Only fetch the thread if the slug is provided
    if (props.slug) {
      fetchData();
    }
  }, [addToast, props.slug]);

  useEffect(() => {
    // Search will be done over a websocket connection.
    // The websocket connection is closed once request is fulfilled.
    // Handshaking every time a search is made is not efficient, but it is fine for now.
    // We try to avoid holding long-lived connections to the servers.
    (async () => {
      // queryId is unique for each search query. queryId is generated on the client side when a new query is made.
      const { query, queryId } = currentQuery;

      if (!query || !queryId) return;

      // If the current query's UUID is the same as the last processed query's UUID, don't create a new QA
      if (queryId === lastQueryIdRef.current) return;
      lastQueryIdRef.current = queryId;

      setProcessing((prev) => true);
      setRelatedQuestions([]);

      // Add the new in-progress QA to the thread
      setQAThread((prev) => [
        ...prev,
        {
          id: queryId,
          query,
          answer: null,
          webSources: null,
          mediums: null,
          metadata: null,
        },
      ]);

      // Now, we are ready to make the search request through the websocket

      // Close the existing socket connection if it exists cuze we are going to create a new one
      // Most likely, this will not be the case, but just in case
      if (socketRef.current) {
        socketRef.current.close();
      }

      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_HOST!, {
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        // Send the query to the server once the connection is established
        newSocket.emit('sensei_ask', threadId.current, query);

        // Reset context state, although it is not necessary
        dispatch!({ type: 'UPDATE_CURRENT_QUERY', payload: null });
      });

      newSocket.on('web_results', ({ data }) => {
        setQAThread((prevQAThread) =>
          produce(prevQAThread, (draft) => {
            if (draft.length === 0) return;

            const lastQA = draft[draft.length - 1];
            lastQA.webSources = data;
          })
        );
      });

      newSocket.on('metadata', ({ data }) => {
        setQAThread((prevQAThread) =>
          produce(prevQAThread, (draft) => {
            if (draft.length === 0) return;

            const lastQA = draft[draft.length - 1];
            lastQA.metadata = data;
          })
        );
      });

      newSocket.on('medium_results', ({ data }) => {
        setQAThread((prevQAThread) =>
          produce(prevQAThread, (draft) => {
            if (draft.length === 0) return;

            const lastQA = draft[draft.length - 1];
            lastQA.mediums = data;
          })
        );
      });

      newSocket.on('answer', ({ data }) => {
        setQAThread((prevQAThread) =>
          produce(prevQAThread, (draft) => {
            if (draft.length === 0) return;

            const lastQA = draft[draft.length - 1];
            // Concatenate the answer if it is not the first response
            lastQA.answer = lastQA.answer ? lastQA.answer + data : data;
          })
        );
      });

      newSocket.on('related_questions', ({ data }) => {
        setRelatedQuestions((relatedQuestions) => data);
      });

      newSocket.on('thread_metadata', ({ data }) => {
        // Save to chat thread store
        ChatThreadStore.addEntry({
          id: threadId.current,
          ts: data.created_at,
          slug: data.slug,
          displayName: data.name,
        });

        // Notify sidebar to update the list
        dispatch!({ type: 'RELOAD_SIDEBAR' });

        window.history.replaceState(null, '', `/search/${data.slug}`);
      });

      newSocket.on('disconnect', () => {
        setProcessing(false);
        console.log('Disconnected from the server');
        newSocket.close(); // Close the socket when 'disconnect' event is received
        socketRef.current = null;
      });

      // Socket level errors
      newSocket.on('error', (error) => {
        setProcessing(false);
        addToast('An error occurred', 'error');
        console.error('An error occurred:', error);
      });

      // Server app level errors
      newSocket.on('app_error', ({ message }) => {
        setProcessing(false);
        addToast(message, 'error');
      });

      socketRef.current = newSocket;
    })();
  }, [addToast, currentQuery, qaThread, dispatch, router]);

  useEffect(() => {
    if (endOfList.current) {
      const elementTop = endOfList.current.getBoundingClientRect().top;
      window.scrollTo({
        top: window.scrollY + elementTop - 20,
        behavior: 'smooth',
      });
    }
  }, [qaThread]);

  return (
    <>
      {qaThread.map((qa, index) => (
        <React.Fragment key={qa.id}>
          {index !== 0 && <Separator />}
          {/* Marker for the end of the QA cells */}
          <div
            ref={endOfList}
            className={
              index === qaThread.length - 1 && qa.webSources === null
                ? 'h-0 w-full'
                : ''
            }
          ></div>
          <ChatHistoryItem
            webSources={qa.webSources}
            mediums={qa.mediums}
            answer={qa.answer}
            query={qa.query}
            metadata={qa.metadata}
          />
        </React.Fragment>
      ))}
      {relatedQuestions.length > 0 && (
        <>
          <div className="grid md:grid-cols-12 grid-cols-1 gap-6 ">
            <div className="col-span-8">
              <Separator />
              <div className="flex items-center mt-8 mb-3">
                <ListPlus className="h-6 w-6 mr-2" />
                <h2 className="text-lg font-medium my-0">Related</h2>
              </div>
              <ul className="m-0">
                {relatedQuestions.map((question, index) => (
                  <li
                    key={index}
                    className="flex m-0 justify-between items-start py-3 border-t hover:text-brand cursor-pointer"
                    onClick={() => {
                      setRelatedQuestions([]);
                      dispatch!({
                        type: 'UPDATE_CURRENT_QUERY',
                        payload: question,
                      });
                    }}
                  >
                    <span>{question}</span>
                    <span className="text-blue-500 cursor-pointer">
                      <Plus className="text-brand" size={20} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-4"></div>
          </div>
        </>
      )}
      <div className="h-40 w-full"></div>
      <div
        className={cn(
          'grid md:grid-cols-12 grid-cols-1 gap-0 md:gap-6 fixed left-1/2 bottom-0 md:bottom-10 transform -translate-x-1/2 max-w-screen-lg w-full',
          isSidebarOpen
            ? 'sm:left-[var(--half-width-plus-half-sidebar-expanded)]'
            : 'sm:left-[var(--half-width-plus-half-sidebar-collapsed)]'
        )}
      >
        <div className="col-span-8 px-2 md:px-0">
          <SearchInput
            onSearch={(value) => {
              dispatch!({ type: 'UPDATE_CURRENT_QUERY', payload: value });
            }}
            disabled={processing}
          />
        </div>
        <div className="col-span-4"></div>
      </div>
    </>
  );
}

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadIdRef = useRef(searchParams.get('threadId'));

  useEffect(() => {
    if (!threadIdRef.current) {
      // If threadId doesn't exist in the query string, redirect to the home page
      router.push('/');
    }
  }, [router]);

  if (!threadIdRef.current) {
    return <div></div>;
  }

  return (
    // TODO: add fallback
    <Suspense fallback={<div></div>}>
      <SearchComponent threadId={threadIdRef.current} />
    </Suspense>
  );
}
