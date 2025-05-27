import Sidebar from './Sidebar';
import Header from './Header';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
