'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import SearchInputBig from './components/SearchInputBig';
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
        <div className="text-3xl mb-5 opacity-85">Search with Sensei</div>
        <SearchInputBig
          onSearch={(val) => {
            dispatch!({ type: 'UPDATE_CURRENT_QUERY', payload: val });
            router.push('/search');
          }}
        />
      </div>
    </main>
  );
}
