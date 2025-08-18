'use client';

import Link from 'next/link';
import { Breadcrumb as AntBreadcrumb, type BreadcrumbProps as AntdBreadcrumbProps } from 'antd';

interface BreadcrumbItem {
  label: string;
  href?: string; // optional: item cuối không có href
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Chuyển sang cấu trúc items của Ant Design
  const antdItems: AntdBreadcrumbProps['items'] = items.map((item) => ({
    title: item.href ? (
      <Link href={item.href} className="hover:underline">
        {item.label}
      </Link>
    ) : (
      <span className="font-semibold text-black">{item.label}</span>
    ),
  }));

  return (
    <nav aria-label="Breadcrumb">
      <AntBreadcrumb separator="/" items={antdItems} />
    </nav>
  );
}
