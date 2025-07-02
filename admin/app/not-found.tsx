'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4"
      style={{ backgroundColor: '#F9FAFB' }}>
      <h1 className="text-6xl font-bold mb-4" style={{ color: '#db4444' }}>
        404 Not Found
      </h1>
      <p className="text-base text-gray-600 mb-6">
        The page you visited does not exist.
      </p>

      <Link
        href="/"
        className="px-5 py-2 rounded bg-[#db4444] text-white hover:bg-[#c63a3a] transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
