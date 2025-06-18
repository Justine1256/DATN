'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-white">
      <h1 className="text-6xl font-bold text-black mb-4">404 Not Found</h1>
      <p className="text-base text-gray-600 mb-6">
        The page you visited does not exist.
      </p>

      {/* ✅ Link back dùng prefetch & replace */}
      <Link
        href="/home"
        prefetch
        replace
        className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition"
      >
        Back to home page
      </Link>
    </div>
  );
}
