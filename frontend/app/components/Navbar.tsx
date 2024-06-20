import React from 'react';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 md:px-0">
        <div className="flex items-center py-2">
          <Image src="/sensei.svg" alt="logo" width={32} height={32} />
          <span className="ml-2 text-2xl font-medium">Sensei</span>
        </div>
      </div>
    </nav>
  );
}
