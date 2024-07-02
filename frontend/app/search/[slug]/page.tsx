'use client';

import { useEffect, useState } from 'react';
import ChatThreadStore, { ChatThreadEntry } from '@/ChatThreadStore';
import { SearchCommon } from '@/search/components/SearchCommon';

export default function SearchPage({ params }: { params: { slug: string } }) {
  const [chatThread, setChatThread] = useState<
    ChatThreadEntry | undefined | null
  >(null);

  useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== 'undefined') {
      const foundChatThread = ChatThreadStore.findBySlug(params.slug);
      setChatThread(foundChatThread);
    }
  }, [params.slug]);

  if (!chatThread) {
    return null;
  }

  return <SearchCommon threadId={chatThread.id} slug={params.slug} />;
}
