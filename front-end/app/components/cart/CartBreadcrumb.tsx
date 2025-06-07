import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string; // optional, phần cuối không có href
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="text-sm text-gray-500 flex items-center space-x-1">
      {items.map((item, index) => (
        <span key={index} className="flex items-center space-x-1">
          {index > 0 && <span className="text-gray-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-black">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
