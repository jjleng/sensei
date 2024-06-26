import React from 'react';

export function WebSourceSkeleton() {
  return (
    <div role="status" className="max-w-sm animate-pulse">
      <div className="h-24 bg-accent rounded-md  w-auto"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function AnswerSkeleton() {
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
export function WidgetSkeleton() {
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
