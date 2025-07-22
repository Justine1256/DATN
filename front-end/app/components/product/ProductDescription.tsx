'use client';

import React, { useMemo } from 'react';

interface ProductDescriptionProps {
    html?: string;
}

export default function ProductDescription({ html }: ProductDescriptionProps) {
    const processedHtml = useMemo(() => {
        if (!html) return '';

        const container = document.createElement('div');
        container.innerHTML = html;

        // ✅ Xử lý mục "Danh Mục"
        const rows = container.querySelectorAll('tr');
        rows.forEach((tr) => {
            const th = tr.querySelector('th')?.textContent?.trim()?.toLowerCase();
            if (th === 'danh mục') {
                const td = tr.querySelector('td');
                if (td) {
                    const links = Array.from(td.querySelectorAll('a'));
                    td.innerHTML = '';
                    links.forEach((link, idx) => {
                        td.appendChild(link.cloneNode(true));
                        if (idx < links.length - 1) {
                            td.appendChild(document.createTextNode(' > '));
                        }
                    });
                }
            }
        });

        // ✅ Thêm Tailwind class cho ul > li
        const listItems = container.querySelectorAll('ul > li');
        listItems.forEach((li) => {
            li.classList.add(
                'grid',
                'grid-cols-[200px_minmax(0,1fr)]',
                'items-start',
                'gap-2',
                'mb-1'
            );
        });

        // ✅ Thêm class cho strong
        container.querySelectorAll('ul > li > strong').forEach((el) => {
            el.classList.add('font-semibold', 'text-black');
        });

        // ✅ Thêm class cho table
        container.querySelectorAll('table').forEach((table) => {
            table.classList.add('w-full', 'text-sm');
        });

        // ✅ Thêm class cho th
        container.querySelectorAll('th').forEach((th) => {
            th.classList.add('text-left', 'align-top', 'py-2');
        });

        // ✅ Thêm class cho td
        container.querySelectorAll('td').forEach((td) => {
            td.classList.add('align-top', 'py-2');
        });

        // ✅ Chuyển #Hashtag thành <a href="/search?query=hashtag">
        container.querySelectorAll('p, li, td, span, div').forEach((el) => {
            el.innerHTML = el.innerHTML.replace(
                /#([a-zA-Z0-9-_]+)/g,
                (_, tag) =>
                    `<a href="/search?query=${tag}" class="text-brand hover:text-red-700">#${tag}</a>`
            );
        });

        return container.innerHTML;
    }, [html]);

    return (
        <>
            <div className="flex items-center">
                <div className="w-[10px] h-[22px] bg-[#db4444] rounded-tl-sm rounded-bl-sm mr-2" />
                <p className="font-medium text-brand text-base">Thông tin sản phẩm</p>
            </div>

            <div className="border rounded-xl p-6 bg-white shadow-sm">
                <article
                    className="
            leading-relaxed text-[15px] text-black
            [&_a[href^='http']]:text-black 
            [&_a[href^='http']:hover]:text-brand
            [&_a[href^='/']]:text-brand
            [&_a[href^='/']:hover]:text-brand
            [&_a[href^='#']]:text-brand
            [&_a[href^='#']:hover]:text-[#b91c1c]
          "
                    dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
            </div>
        </>
    );
}
