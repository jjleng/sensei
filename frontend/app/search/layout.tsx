import React from 'react';

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 md:px-0">
        {children}
      </div>
    </>
  );
}
