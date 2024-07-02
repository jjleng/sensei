'use client';

import ChatThreadStore from '@/ChatThreadStore';
import { SearchComponent } from '../page';

export default function SearchPage({ params }: { params: { slug: string } }) {
  const chatThread = ChatThreadStore.findBySlug(params.slug);

  if (!chatThread) {
    return <div>Chat not found</div>;
  }

  // Get the url parameter
  return <SearchComponent threadId={chatThread.id} />;
}
