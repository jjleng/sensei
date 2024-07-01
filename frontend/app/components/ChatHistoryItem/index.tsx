import React, { useMemo } from 'react';
import Link from 'next/link';
import WebSourceCard, {
  WebSourceMoreCard,
} from '@/components/ChatHistoryItem/WebSourceCard';
import { MediumImage, MediumVideo, MetaData, WebSource } from '@/types';
import RichContentRenderer from '@/components/RichContentRenderer';
import { AnswerSkeleton, WebSourceSkeleton } from './Skeletons';
import ImageVideoWidget from './ImageVideoWidget';
import { cn } from '@/lib/utils';

interface ChatHistoryItemProps {
  webSources: WebSource[] | null;
  mediums: (MediumImage | MediumVideo)[] | null;
  answer: string | null;
  query: string;
  metadata: MetaData | null;
}

// Convert [1,2,...] to [1][2]...
function convertToIndividualCitations(input: string): string {
  return input.replace(/\[(\d+(?:,\s*\d+)*)\]/g, (match, numbers) => {
    return numbers
      .split(',')
      .map((num: string) => `[${num.trim()}]`)
      .join('');
  });
}

// Convert `[1]` to be `[1](https://url)`, which is a valid markdown URL
function convertCitationsToMarkdownLinks(
  input: string,
  webSources: { url: string }[]
): string {
  return input.replace(/\[(\d+)\](?!\(.*?\))/g, (match, number) => {
    const index = parseInt(number, 10) - 1;
    if (index >= 0 && index < webSources.length) {
      return `[${number}](${webSources[index].url})`;
    }
    return match;
  });
}

// $$ formula [1][2] $$ -> $$ formula $$[1][2]
function preprocessLatexFormulas(text: string): string {
  // Process block formulas with citations
  const processedBlocks = text.replace(
    /\$\$([^$]+?)\s*(\[\d+\]\s*)+\$\$/g,
    (match, formulaContent, citationGroup) => {
      const citations = citationGroup.trim().replace(/\s+/g, '');
      return `$$${formulaContent.trim()}$$\n${citations}`;
    }
  );

  // Process inline formulas with citations
  const processedInlines = processedBlocks.replace(
    /\$([^$]+?)\s*(\[\d+\]\s*)+\$/g,
    (match, formulaContent, citationGroup) => {
      const citations = citationGroup.trim().replace(/\s+/g, '');
      return `$${formulaContent.trim()}$${citations}`;
    }
  );

  const augmentedFormulas = processedInlines.replace(
    /\$\$((?:\[\d+\])+)\s*/g,
    '$$\n$1'
  );

  return augmentedFormulas;
}

export default function ChatHistoryItem(props: ChatHistoryItemProps) {
  const { answer, webSources } = props;

  const formattedAnswer = useMemo(() => {
    if (!answer) return '';

    if (!webSources) return answer;

    let preprocessedAnswer = convertToIndividualCitations(answer);
    preprocessedAnswer = preprocessLatexFormulas(preprocessedAnswer);

    return convertCitationsToMarkdownLinks(preprocessedAnswer, webSources);
  }, [answer, webSources]);

  const queryLength = props.query.split(' ').length;

  return (
    <div className="grid md:grid-cols-12 grid-cols-1 gap-6 py-8">
      <div className="col-span-8">
        <pre
          className={cn(
            'font-display  font-regular mb-4 w-full whitespace-pre-wrap',
            queryLength >= 25 ? 'text-xl' : 'text-3xl'
          )}
        >
          {props.query}
        </pre>

        <div className="mb-6">
          {props.webSources?.length !== 0 && (
            <h2 className="text-lg font-medium mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              Sources
            </h2>
          )}
          <div className="flex grid grid-flow-col gap-2 px-md sm:grid-cols-2 md:px-0 md:grid-cols-4 overflow-x-auto">
            {props.webSources === null ? (
              <>
                {[...Array(4)].map((_, index) => (
                  <WebSourceSkeleton key={index} />
                ))}
              </>
            ) : (
              <>
                {props.webSources.slice(0, 3).map((source, index) => (
                  <div key={source.url} className="min-w-[100px] h-full">
                    <Link key={source.url} href={source.url} target="_blank">
                      <WebSourceCard
                        key={source.url}
                        url={source.url}
                        title={source.title}
                        index={index + 1}
                        content={source.content}
                      />
                    </Link>
                  </div>
                ))}
              </>
            )}
            {props.webSources !== null && props.webSources.length > 3 && (
              <div className="min-w-[100px] h-full">
                <WebSourceMoreCard
                  webSources={props.webSources
                    .slice(3)
                    .map((source, index) => ({ ...source, index: index + 4 }))}
                />
              </div>
            )}
          </div>
        </div>

        <>
          <h2 className="text-lg font-medium mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
            Answer
          </h2>
          <div className="md:hidden">
            <ImageVideoWidget mediums={props.mediums} />
          </div>
          {props.answer === null ? (
            <AnswerSkeleton />
          ) : (
            <RichContentRenderer
              richContent={formattedAnswer}
              enableMath={
                (props.metadata && props.metadata['has_math']) || false
              }
            />
          )}
        </>
      </div>
      <div className="col-span-4 hidden md:block">
        <div className="sticky top-4 space-y-4">
          <ImageVideoWidget mediums={props.mediums} />
        </div>
      </div>
    </div>
  );
}
