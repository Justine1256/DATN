import { Suspense } from 'react';
import SearchPageClient from './SearchPage';

export default function Page() {
    return (
        <Suspense fallback={<div className="p-4">Đang tải kết quả tìm kiếm...</div>}>
            <SearchPageClient />
        </Suspense>
    );
}
