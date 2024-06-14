import React, { useMemo } from 'react';
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
    <div className="grid grid-cols-2 gap-2">
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
          <div className="grid grid-flow-col gap-2 px-md sm:grid-cols-2 md:px-0 md:grid-cols-4">
            {props.webSources === null ? (
              <>
                <WebSourceSkeleton />
                <WebSourceSkeleton />
                <WebSourceSkeleton />
                <WebSourceSkeleton />
              </>
            ) : (
              <>
                {props.webSources.slice(0, 3).map((source) => (
                  <WebSourceCard
                    key={source.url}
                    url={source.url}
                    title={source.title}
                    index={source.index}
                    content={source.content}
                  />
                ))}
              </>
            )}
            {props.webSources !== null && props.webSources.length > 3 && (
              <WebSourceMoreCard webSources={props.webSources.slice(3)} />
            )}
          </div>
        </div>

        <>
          <h2 className="text-lg font-medium mb-2">Answer</h2>
          {props.answer === null ? (
            <AnswerSkeleton />
          ) : (
            <p className="mb-4">
              <RichContentRenderer richContent={formattedAnswer} />
            </p>
          )}
        </>
      </div>
      <div className="col-span-4">
        <div className="sticky top-4 space-y-4">
          {props.mediums === null ? (
            <WidgetSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {props.mediums.slice(0, 4).map((medium) => (
                <div
                  key={medium.url}
                  className="h-48 bg-gray-200 dark:bg-gray-700 rounded-md"
                >
                  {medium.medium === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={medium.image}
                      alt={medium.title}
                      className="h-full w-full object-cover rounded-md"
                    />
                  ) : medium.medium === 'video' ? (
                    <video
                      controls
                      className="h-full w-full object-cover rounded-md"
                    >
                      <source src={medium.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
