import React, { useMemo } from 'react';
import Link from 'next/link';
import WebSourceCard, { WebSourceMoreCard } from './WebSourceCard';
import { MediumImage, MediumVideo, WebSource } from '../../types';
import RichContentRenderer from '../../../components/RichContentRenderer';

function WebSourceSkeleton() {
  return (
    <div role="status" className="max-w-sm animate-pulse">
      <div className="h-24 bg-gray-200 rounded-md dark:bg-gray-700 w-auto"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function AnswerSkeleton() {
  return (
    <div role="status" className="w-auto animate-pulse">
      <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[80%] mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[70%] mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[60%] mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[80%]"></div>
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
          <div className="h-16 bg-gray-200 rounded-md dark:bg-gray-700 w-auto"></div>
        </div>
      </div>
      <div className="col-span-1">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-16 bg-gray-200 rounded-md dark:bg-gray-700 w-auto"></div>
        </div>
      </div>
      <div className="col-span-1">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-16 bg-gray-200 rounded-md dark:bg-gray-700 w-auto"></div>
        </div>
      </div>
      <div className="col-span-1">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-16 bg-gray-200 rounded-md dark:bg-gray-700 w-auto"></div>
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
              className="h-24 md:h-48 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden"
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
            <h2 className="text-lg font-medium mb-2">Sources</h2>
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
                <WebSourceMoreCard webSources={props.webSources.slice(3)} />
              </div>
            )}
          </div>
        </div>

        <>
          <h2 className="text-lg font-medium mb-2">Answer</h2>
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
