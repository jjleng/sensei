import React, { useMemo } from 'react';
import Link from 'next/link';
import WebSourceCard, {
  WebSourceMoreCard,
} from '@/search/components/QACell/WebSourceCard';
import { MediumImage, MediumVideo, WebSource } from '@/search/types';
import RichContentRenderer from '@/components/RichContentRenderer';

function WebSourceSkeleton() {
  return (
    <div role="status" className="max-w-sm animate-pulse">
      <div className="h-24 bg-accent rounded-md  w-auto"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function AnswerSkeleton() {
  return (
    <div role="status" className="w-auto animate-pulse">
      <div className="h-2.5 bg-accent rounded-full w-48 mb-4"></div>
      <div className="h-2 bg-accent rounded-full max-w-[80%] mb-2.5"></div>
      <div className="h-2 bg-accent rounded-full mb-2.5"></div>
      <div className="h-2 bg-accent rounded-full max-w-[70%] mb-2.5"></div>
      <div className="h-2 bg-accent rounded-full max-w-[60%] mb-2.5"></div>
      <div className="h-2 bg-accent rounded-full max-w-[80%]"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Widget and/or mediums skeleton
function WidgetSkeleton() {
  return (
    <div className="grid md:grid-cols-2 grid-cols-4 gap-2">
      <div className="col-span-1">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-16 bg-accent rounded-md w-auto"></div>
        </div>
      </div>
      <div className="col-span-1">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-16 bg-accent rounded-md w-auto"></div>
        </div>
      </div>
      <div className="col-span-1">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-16 bg-accent rounded-md w-auto"></div>
        </div>
      </div>
      <div className="col-span-1">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-16 bg-accent rounded-md w-auto"></div>
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface QACellProps {
  webSources: WebSource[] | null;
  mediums: (MediumImage | MediumVideo)[] | null;
  answer: string | null;
  query: string;
}

function Widgets(props: Pick<QACellProps, 'mediums'>) {
  return (
    <div className="mb-2">
      {props.mediums === null ? (
        <WidgetSkeleton />
      ) : (
        <div className="grid md:grid-cols-2 grid-cols-4 gap-2">
          {props.mediums.slice(0, 4).map((medium) => (
            <div
              key={medium.url}
              className="h-24 md:h-48 bg-accent rounded-md overflow-hidden"
            >
              {medium.medium === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={medium.image}
                  alt={medium.title}
                  className="h-full w-full object-cover rounded-md"
                />
              ) : medium.medium === 'video' ? (
                medium.url.includes('youtube') ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${new URLSearchParams(
                      new URL(medium.url).search
                    ).get('v')}`}
                    title={medium.title}
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video
                    controls
                    className="h-full w-full object-cover rounded-md"
                  >
                    <source src={medium.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QACell(props: QACellProps) {
  const { answer, webSources } = props;

  const formattedAnswer = useMemo(() => {
    if (!answer) return '';

    if (!webSources) return answer;

    return answer.replace(/\[(\d+)\](?!\(.*?\))/g, (match, number) => {
      if (number > webSources.length) return match;

      return `[${number}](${webSources[number - 1].url})`;
    });
  }, [answer, webSources]);

  return (
    <div className="grid md:grid-cols-12 grid-cols-1 gap-6 py-8 text-text-light dark:text-text-dark">
      <div className="col-span-8">
        <h1 className="font-display text-3xl font-regular mb-4">
          {props.query}
        </h1>

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
                <WebSourceSkeleton />
                <WebSourceSkeleton />
                <WebSourceSkeleton />
                <WebSourceSkeleton />
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
            <Widgets mediums={props.mediums} />
          </div>
          {props.answer === null ? (
            <AnswerSkeleton />
          ) : (
            <RichContentRenderer richContent={formattedAnswer} />
          )}
        </>
      </div>
      <div className="col-span-4 hidden md:block">
        <div className="sticky top-4 space-y-4">
          <Widgets mediums={props.mediums} />
        </div>
      </div>
    </div>
  );
}
