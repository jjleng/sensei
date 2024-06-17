'use client';

import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { produce } from 'immer';
import SearchInput from './components/SearchInput';
import QACell from './components/QACell';
import { io, Socket } from 'socket.io-client';
import { useToast } from '../hooks/use-toast';
import { WebSource, MediumImage, MediumVideo } from './types';
import Context from '../context';

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
}

export default function Search() {
  // Conversation thread ID
  // Here, we generate a new thread ID for each page refresh. If the thread ID doesn't exist, server will crate a new thread.
  // Client could also choose to send in an existing thread ID to continue the conversation.
  // Ideally, the thread ID should be generated on the server and sent to the client. But for now, this is not the case.
  const threadId = useRef(uuidv4());

  // Store the websocket
  const socketRef = useRef<Socket | null>(null);

  // If the search is in progress
  const [processing, setProcessing] = useState(false);
  // QA thread is a list of QA objects. Each QA object represents a query and its response along with the search results.
  const [qaThread, setQAThread] = useState<QA[]>([]);
  // Current query is stored in the context.
  const { currentQuery, dispatch } = useContext(Context);

  // Store the last processed query's UUID, so that we don't process the same query multiple times.
  // React might re-render the component multiple times for the same query.
  const lastQueryIdRef = useRef<string | null>(null);

  // Reference to the end of the list. This is used to scroll to the end of the list when a new QA is updated and/or added.
  const endOfList = useRef<HTMLDivElement>(null);

  const { addToast } = useToast();

  useEffect(() => {
    // Search will be done over a websocket connection.
    // The websocket connection is closed once request is fulfilled.
    // Handshaking every time a search is made is not efficient, but it is fine for now.
    // We try to avoid holding long-lived connections to the servers.
    (async () => {
      // queryId is unique for each search query. queryId is generated on the client side when a new query is made.
      const { query, queryId } = currentQuery;

      if (!query || !queryId) return;

      console.log('Current query: ', currentQuery);

      // If the current query's UUID is the same as the last processed query's UUID, don't create a new QA
      if (queryId === lastQueryIdRef.current) return;
      lastQueryIdRef.current = queryId;

      console.log('Search query: ', query);
      setProcessing((prev) => true);

      // Add the new in-progress QA to the thread
      setQAThread((prev) => [
        ...prev,
        {
          id: queryId,
          query,
          answer: null,
          webSources: null,
          mediums: null,
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
            lastQA.webSources = (data as WebSource[]).map((source, index) => ({
              ...source,
              index: index + 1,
            }));
          })
        );
      });

      newSocket.on('medium_results', ({ data }) => {
        setQAThread((prevQAThread) =>
          produce(prevQAThread, (draft) => {
            if (draft.length === 0) return;

            const lastQA = draft[draft.length - 1];
            lastQA.mediums = (data as (MediumImage | MediumVideo)[]).map(
              (source, index) => ({
                ...source,
                index: index + 1,
              })
            );
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
  }, [addToast, currentQuery, qaThread, dispatch]);

  useEffect(() => {
    if (endOfList.current) {
      endOfList.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaThread]);

  return (
    <div>
      {qaThread.map((qa, index) => (
        <React.Fragment key={qa.id}>
          {index !== 0 && <div className="border-t border-gray-200 my-4"></div>}
          <QACell
            webSources={qa.webSources}
            mediums={qa.mediums}
            answer={qa.answer}
            query={qa.query}
          />
          {/* Marker for the end of the QA cells */}
          <div
            ref={endOfList}
            className={index === qaThread.length - 1 ? 'mb-40 w-full' : ''}
          ></div>
        </React.Fragment>
      ))}
      <div className="grid md:grid-cols-12 grid-cols-1 gap-0 md:gap-6 fixed bottom-0 md:bottom-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-screen-lg w-full">
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
    </div>
  );
}
