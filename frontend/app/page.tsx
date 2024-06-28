'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import SearchArea from './components/SearchArea';
import Context from './context';

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
            router.push('/search');
            dispatch!({ type: 'UPDATE_CURRENT_QUERY', payload: val });
          }}
        />
      </div>
    </main>
  );
}
