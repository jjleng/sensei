'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import SearchArea from '@/components/SearchArea';
import Context from '@/context';

export default function Home() {
  const { dispatch } = useContext(Context);
  const router = useRouter();

  return (
    <main
      className="flex items-center justify-center min-h-screen px-4 sm:px-0"
      style={{ minHeight: 'calc(100vh - 60px)' }}
    >
      <div className="w-full sm:max-w-2xl flex flex-col items-center">
        <div>
          <pre className="font-display text-3xl font-regular mb-4 w-full whitespace-pre-wrap">
            Discover Answers with Sensei
          </pre>
        </div>
        <SearchArea
          onSearch={(val) => {
            // Conversation thread ID
            // Here, we generate a new thread ID for each page refresh. If the thread ID doesn't exist, server will crate a new thread.
            // Client could also choose to send in an existing thread ID to continue the conversation.
            // Ideally, the thread ID should be generated on the server and sent to the client. But for now, this is not the case.
            router.push(`/search?threadId=${uuidv4()}`);
            dispatch!({ type: 'UPDATE_CURRENT_QUERY', payload: val });
          }}
        />
      </div>
    </main>
  );
}
