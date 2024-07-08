import { SearchCommon } from '@/search/components/SearchCommon';

const fetchData = async (slug: string) => {
  try {
    const response = await fetch(`${process.env.HTTP_SERVER!}/threads/${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch the thread');
    }

    const { thread_id, chat_history, metadata } = await response.json();
    return {
      threadId: thread_id,
      chatHistory: chat_history,
      metadata,
      error: null,
    };
  } catch (error) {
    console.log(error);
    return { error: 'Failed to load chat history.' };
  }
};

export default async function SearchPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await fetchData(params.slug);

  return <SearchCommon {...data} />;
}
