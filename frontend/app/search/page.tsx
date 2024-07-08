'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchCommon } from '@/search/components/SearchCommon';

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
      <SearchCommon threadId={threadIdRef.current} error={null} />
    </Suspense>
  );
}
