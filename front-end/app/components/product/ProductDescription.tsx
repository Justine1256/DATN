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

            const rows = container.querySelectorAll('tr');
            rows.forEach((tr) => {
                const th = tr.querySelector('th')?.textContent?.trim();
                if (th === 'Danh Mục') {
                    const td = tr.querySelector('td');
                    if (td) {
                        const links = Array.from(td.querySelectorAll('a'));
                        td.innerHTML = '';
                        links.forEach((link, idx) => {
                            td.appendChild(link);
                            if (idx < links.length - 1) {
                                td.appendChild(document.createTextNode(' > '));
                            }
                        });
                    }
                }
            });

            return container.innerHTML;
        }, [html]);

        return (
            <>
                <div className="    flex items-center">

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
                        [&_table]:w-full 
                        [&_table]:text-sm
                        [&_th]:text-left 
                        [&_th]:align-top
                        [&_td]:align-top 
                        [&_td]:py-2
                        [&_ul]:pl-0
                        [&_ul>li]:grid
                        [&_ul>li]:grid-cols-[200px_minmax(0,1fr)] 
                        [&_ul>li]:items-start
                        [&_ul>li]:gap-2
                        [&_ul>li]:mb-1
                        [&_ul>li>strong]:font-semibold
                        [&_ul>li>strong]:text-black
                        "
                        dangerouslySetInnerHTML={{ __html: processedHtml }}
                    />
                </div>
            </>
        );
        
    }
