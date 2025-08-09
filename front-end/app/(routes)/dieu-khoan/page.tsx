'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, FilterX, ChevronRight, Printer } from 'lucide-react'

/**
 * Marketo – Điều Khoản & Chính Sách (single file)
 * UI refresh: brand #db4444, clean layout, sticky TOC with active state, smooth scroll,
 * search highlight + first-hit scroll, TOC click = filter view, print button.
 */

// ===== Brand color & minor CSS helpers =====
const BRAND = '#db4444'
function escapeRegExp(str: string) {
    // Escape regex meta characters in the search term
    return str.replace(/[.*+?^${}()|[\]\\]/g, '$&')
}


// Highlight matches inside content without breaking markup
function highlightContainer(container: HTMLElement, term: string) {
    const targets = container.querySelectorAll('h1, h2, h3, p, li')
    targets.forEach((el) => {
        const html = (el as HTMLElement).dataset.origHtml ?? el.innerHTML
            ; (el as HTMLElement).dataset.origHtml = html
        if (!term) {
            el.innerHTML = html
            return
        }
        const re = new RegExp(`(${escapeRegExp(term)})`, 'gi')
        el.innerHTML = html.replace(
            re,
            '<mark class="px-0.5 rounded bg-[rgba(219,68,68,0.14)] ring-1 ring-[rgba(219,68,68,0.35)]">$1</mark>'
        )
    })
}

export default function Page() {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeId, setActiveId] = useState<string | null>(null)
    const contentRef = useRef<HTMLDivElement | null>(null)

    const toc = useMemo(
        () => [
            { id: 'gioi-thieu', text: '1. Giới thiệu' },
            { id: 'doi-tuong-ap-dung', text: '2. Đối tượng áp dụng' },
            { id: 'phan1', text: 'PHẦN I – Chính sách riêng cho Người mua' },
            { id: 'phan2', text: 'PHẦN II – Chính sách riêng cho Người bán' },
            { id: 'phan3', text: 'PHẦN III – Chính sách vận chuyển' },
            { id: 'phan4', text: 'PHẦN IV – Chính sách xử lý khiếu nại' },
            { id: 'phan5', text: 'PHẦN V – Điều khoản chung' },
            { id: 'phan6', text: 'PHẦN VI – Chính sách Đổi — Trả hàng' },
        ],
        []
    )

    // Highlight + auto-scroll to first match
    useEffect(() => {
        if (!contentRef.current) return
        highlightContainer(contentRef.current, searchTerm)
        if (searchTerm) {
            const first = contentRef.current.querySelector('mark')
            if (first) (first as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
            const wrap = first?.closest('section[id]') as HTMLElement | null
            if (wrap) setActiveId((prev) => prev ?? wrap.id)
        }
    }, [searchTerm])

    // Smooth scroll for anchor jumps
    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth'
        return () => {
            document.documentElement.style.scrollBehavior = ''
        }
    }, [])

    const handleTocClick = (id: string) => {
        setActiveId(id)
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const clearFilter = () => setActiveId(null)

    return (
        <div className="min-h-screen bg-slate-50 py-10">
            {/* Top banner */}
            <div className="border-b" style={{ borderColor: `${BRAND}33` }}>
                <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: BRAND }}>
                            Marketo Policy Center
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900">
                            Điều khoản & Chính sách sử dụng – Marketo E‑Commerce Platform
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm trong chính sách..."
                                className="w-72 rounded-xl border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-4"
                                style={{
                                    borderColor: BRAND,
                                    boxShadow: searchTerm ? '0 0 0 4px rgba(219,68,68,0.12)' : undefined,
                                }}
                            />
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-slate-50"
                            style={{ borderColor: BRAND, color: BRAND }}
                        >
                            <Printer className="h-4 w-4" /> In
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* TOC */}
                <aside className="lg:col-span-3">
                    <div className="rounded-2xl border bg-white shadow-sm p-4 sticky top-4" style={{ borderColor: `${BRAND}33` }}>
                        <h2 className="text-sm font-semibold mb-3" style={{ color: BRAND }}>Mục lục</h2>
                        <ul className="space-y-1">
                            {toc.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleTocClick(item.id)}
                                        className={`group w-full flex items-center gap-2 text-sm rounded-lg px-2 py-1 hover:bg-slate-50`}
                                        aria-current={activeId === item.id}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full border mr-1`}
                                            style={{
                                                background: activeId === item.id ? BRAND : 'transparent',
                                                borderColor: activeId === item.id ? BRAND : '#cbd5e1',
                                            }}
                                        />
                                        <span className={`truncate ${activeId === item.id ? 'font-medium' : ''}`} style={{ color: activeId === item.id ? BRAND : undefined }}>
                                            {item.text}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {activeId && (
                            <button
                                onClick={clearFilter}
                                className="mt-4 inline-flex items-center gap-2 text-sm px-2 py-1 rounded-lg border hover:bg-slate-50"
                                style={{ borderColor: BRAND, color: BRAND }}
                            >
                                <FilterX className="h-4 w-4" /> Bỏ lọc
                            </button>
                        )}
                    </div>
                </aside>

                {/* Content */}
                <main className="lg:col-span-9">
                    <div
                        ref={contentRef}
                        className="rounded-2xl border bg-white shadow-sm p-6 md:p-8 prose prose-slate max-w-none"
                        style={{ borderColor: `${BRAND}33` }}
                    >
                        {/* Heading styles */}
                        <style>{`:where(h2,h3){scroll-margin-top:96px}`}</style>

                        {/* SECTION 1 */}
                        <section id="gioi-thieu" className={activeId && activeId !== 'gioi-thieu' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>1. Giới thiệu</h2>
                            <p>
                                Điều khoản và Chính sách này quy định quyền lợi, nghĩa vụ và trách nhiệm của các bên khi tham gia sàn thương mại điện tử Marketo.
                                Bằng việc truy cập và sử dụng Marketo, người dùng đồng ý tuân thủ toàn bộ các điều khoản được nêu tại đây.
                            </p>
                        </section>

                        {/* SECTION 2 */}
                        <section id="doi-tuong-ap-dung" className={activeId && activeId !== 'doi-tuong-ap-dung' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>2. Đối tượng áp dụng</h2>
                            <ul>
                                <li>Người mua (Buyer): cá nhân hoặc tổ chức đặt mua sản phẩm/dịch vụ qua Marketo.</li>
                                <li>Người bán (Seller): cá nhân hoặc tổ chức mở gian hàng, đăng bán sản phẩm/dịch vụ trên Marketo.</li>
                                <li>Quản trị viên (Admin): đơn vị vận hành, quản lý và đảm bảo hoạt động của Marketo.</li>
                            </ul>
                        </section>

                        {/* SECTION 3 */}
                        <section id="phan1" className={activeId && activeId !== 'phan1' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>PHẦN I – CHÍNH SÁCH RIÊNG CHO NGƯỜI MUA</h2>
                            <h3>3. Quyền của Người mua</h3>
                            <ul>
                                <li>Được truy cập và sử dụng mọi chức năng của Marketo dành cho khách hàng.</li>
                                <li>Xem thông tin sản phẩm, đánh giá và so sánh giá trước khi mua.</li>
                                <li>Được lựa chọn phương thức thanh toán phù hợp (COD, VNPay).</li>
                                <li>Nhận hóa đơn, chứng từ liên quan đến giao dịch.</li>
                                <li>Được đổi/trả hàng và hoàn tiền theo Chính sách đổi trả.</li>
                            </ul>
                            <h3>4. Nghĩa vụ của Người mua</h3>
                            <ul>
                                <li>Cung cấp thông tin chính xác khi đăng ký và đặt hàng.</li>
                                <li>Thanh toán đúng hạn và đúng số tiền cho đơn hàng đã xác nhận.</li>
                                <li>
                                    Không: Spam đơn hàng hoặc đặt hàng giả; Gian lận mã giảm giá, voucher; Đưa đánh giá sai sự thật nhằm gây ảnh hưởng đến người bán.
                                </li>
                                <li>Kiểm tra sản phẩm ngay khi nhận để đảm bảo quyền lợi.</li>
                            </ul>
                        </section>

                        {/* SECTION 4 */}
                        <section id="phan2" className={activeId && activeId !== 'phan2' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>PHẦN II – CHÍNH SÁCH RIÊNG CHO NGƯỜI BÁN</h2>
                            <h3>5. Quyền của Người bán</h3>
                            <ul>
                                <li>Tự do đăng bán sản phẩm hợp pháp, phù hợp chính sách Marketo.</li>
                                <li>Tùy chỉnh thông tin gian hàng, hình ảnh và giá bán.</li>
                                <li>Nhận toàn bộ khoản thanh toán của đơn hàng sau khi trừ phí hoa hồng (5%).</li>
                                <li>Sử dụng các công cụ thống kê, quản lý đơn hàng và khách hàng.</li>
                                <li>Được hỗ trợ kỹ thuật, marketing khi có yêu cầu hợp lệ.</li>
                            </ul>
                            <h3>6. Nghĩa vụ của Người bán</h3>
                            <ul>
                                <li>Cung cấp mô tả sản phẩm rõ ràng, trung thực, kèm hình ảnh minh họa.</li>
                                <li>Giao hàng đúng thời gian, số lượng, chất lượng đã cam kết.</li>
                                <li>Chịu trách nhiệm về bảo hành, đổi trả theo quy định.</li>
                                <li>Không đăng bán: Hàng cấm, hàng giả, hàng vi phạm bản quyền; Sản phẩm sai nguồn gốc xuất xứ.</li>
                                <li>Hợp tác với Marketo khi có khiếu nại từ khách hàng. Bảo mật thông tin khách hàng và không sử dụng cho mục đích ngoài giao dịch.</li>
                            </ul>
                        </section>

                        {/* SECTION 5 */}
                        <section id="phan3" className={activeId && activeId !== 'phan3' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>PHẦN III – CHÍNH SÁCH VẬN CHUYỂN</h2>
                            <h3>7. Quy định chung</h3>
                            <ul>
                                <li>Marketo hỗ trợ kết nối người bán với các đơn vị vận chuyển uy tín.</li>
                                <li>Người mua chọn phương thức vận chuyển khi đặt hàng.</li>
                                <li>Thời gian giao hàng phụ thuộc vào khoảng cách, hình thức giao và lịch làm việc của đơn vị vận chuyển.</li>
                            </ul>
                            <h3>8. Trách nhiệm của các bên</h3>
                            <ul>
                                <li>Người bán: Đóng gói hàng hóa an toàn, ghi rõ thông tin người nhận.</li>
                                <li>Đơn vị vận chuyển: Giao hàng đúng thời gian, giữ nguyên tình trạng hàng.</li>
                                <li>Người mua: Cung cấp địa chỉ, số điện thoại chính xác và sẵn sàng nhận hàng.</li>
                            </ul>
                            <h3>9. Phí vận chuyển</h3>
                            <ul>
                                <li>Phí được tính tự động dựa trên trọng lượng, kích thước và địa chỉ nhận.</li>
                                <li>Có thể miễn phí vận chuyển nếu người bán áp dụng chương trình ưu đãi.</li>
                            </ul>
                        </section>

                        {/* SECTION 6 */}
                        <section id="phan4" className={activeId && activeId !== 'phan4' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>PHẦN IV – CHÍNH SÁCH XỬ LÝ KHIẾU NẠI</h2>
                            <h3>10. Tiếp nhận khiếu nại</h3>
                            <p>
                                Gửi qua Trung tâm hỗ trợ trên website; Hệ thống chat tích hợp; Email CSKH của Marketo. Khiếu nại phải kèm: Mã đơn hàng, Mô tả sự việc, Bằng chứng (hình ảnh, hóa đơn, tin nhắn).
                            </p>
                            <h3>11. Quy trình xử lý</h3>
                            <ol>
                                <li>Tiếp nhận: phản hồi trong 24h.</li>
                                <li>Xác minh: liên hệ các bên liên quan.</li>
                                <li>Đưa giải pháp: Đổi/trả; Hoàn tiền; Hỗ trợ kỹ thuật.</li>
                                <li>Kết thúc khiếu nại: Xác nhận và lưu hồ sơ.</li>
                            </ol>
                            <h3>12. Thời hạn xử lý</h3>
                            <ul>
                                <li>Thông thường: tối đa 7 ngày.</li>
                                <li>Phức tạp: tối đa 15 ngày.</li>
                            </ul>
                        </section>

                        {/* SECTION 7 */}
                        <section id="phan5" className={activeId && activeId !== 'phan5' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>PHẦN V – ĐIỀU KHOẢN CHUNG</h2>
                            <h3>13. Bảo mật thông tin</h3>
                            <ul>
                                <li>Chỉ sử dụng thông tin cá nhân cho mục đích giao dịch và quản lý.</li>
                                <li>Không tiết lộ thông tin cho bên thứ ba nếu không có sự đồng ý hoặc yêu cầu pháp luật.</li>
                            </ul>
                            <h3>14. Xử lý vi phạm</h3>
                            <ul>
                                <li>Biện pháp: Cảnh cáo; Tạm khóa tài khoản; Xóa sản phẩm/gian hàng; Cấm vĩnh viễn.</li>
                                <li>Vi phạm pháp luật sẽ báo cáo cơ quan chức năng.</li>
                            </ul>
                            <h3>15. Cập nhật điều khoản</h3>
                            <ul>
                                <li>Marketo có quyền thay đổi, bổ sung và thông báo trên hệ thống.</li>
                                <li>Tiếp tục sử dụng = chấp nhận điều khoản mới.</li>
                            </ul>
                        </section>

                        {/* SECTION 8 */}
                        <section id="phan6" className={activeId && activeId !== 'phan6' ? 'hidden' : ''}>
                            <h2 style={{ color: BRAND }}>VI. Chính sách Đổi — Trả hàng</h2>
                            <h3>1. Mục đích & phạm vi áp dụng</h3>
                            <p>Áp dụng cho tất cả đơn hàng trên Marketo, trừ danh mục không đổi trả.</p>
                            <h3>2. Nguyên tắc chung</h3>
                            <ul>
                                <li>Ưu tiên thương lượng qua chat.</li>
                                <li>Gửi yêu cầu ở trang Đơn hàng → Yêu cầu đổi/hoàn tiền, kèm bằng chứng.</li>
                                <li>Lỗi/nhầm hàng: người bán chịu; đổi ý: người mua chịu phí trả lại.</li>
                            </ul>
                            <h3>3. Điều kiện được đổi/trả</h3>
                            <ol>
                                <li>Không đúng mô tả; thiếu phụ kiện.</li>
                                <li>Lỗi/ hỏng do sản xuất hoặc vận chuyển.</li>
                                <li>Giao nhầm hàng.</li>
                                <li>Chưa sử dụng/không mở seal (nếu danh mục cho phép).</li>
                            </ol>
                            <p>Bằng chứng: ảnh/clip, mã đơn, hóa đơn/biên nhận (nếu có).</p>
                            <h3>4. Quy trình yêu cầu đổi/trả</h3>
                            <ol>
                                <li>Khởi tạo yêu cầu tại Đơn hàng → tải bằng chứng.</li>
                                <li>Xác nhận tiếp nhận trong 24 giờ.</li>
                                <li>Người bán phản hồi trong 48 giờ.</li>
                                <li>Thống nhất phương án và phí trả hàng.</li>
                                <li>Người mua gửi hàng trong 5 ngày + cung cấp tracking.</li>
                                <li>Người bán kiểm tra trong 3 ngày làm việc.</li>
                                <li>Hoàn tiền/đổi hàng; tranh chấp theo mục 9.</li>
                            </ol>
                            <h3>5. Phí vận chuyển trả lại & trách nhiệm chi phí</h3>
                            <ul>
                                <li>Lỗi người bán: chịu toàn bộ phí trả hàng và gửi lại.</li>
                                <li>Đổi ý: người mua chịu phí trả hàng.</li>
                                <li>COD: hoàn tiền theo thỏa thuận (chuyển khoản/tiền mặt/credit Marketo).</li>
                            </ul>
                            <h3>6. Thời hạn xử lý & hoàn tiền</h3>
                            <ul>
                                <li>Ack 24h; phản hồi 48h; gửi trả 5 ngày; xác nhận nhận 3 ngày làm việc.</li>
                                <li>Hoàn tiền trong 7 ngày làm việc (tùy cổng thanh toán).</li>
                                <li>Tranh chấp phức tạp: tối đa 15 ngày.</li>
                            </ul>
                            <h3>7. Hàng không được đổi/trả</h3>
                            <ul>
                                <li>Thực phẩm tươi/dễ hỏng (trừ khi giao hư hỏng ngay).</li>
                                <li>Đã dùng, rửa, biến dạng, mất tem bảo hành.</li>
                                <li>Đặt theo yêu cầu cá nhân.</li>
                                <li>Sản phẩm vệ sinh cá nhân đã mở seal.</li>
                                <li>Sản phẩm số / license / mã code đã kích hoạt.</li>
                                <li>Hư hỏng do sử dụng/bảo quản sai.</li>
                            </ul>
                            <h3>8. Cách thức hoàn tiền</h3>
                            <ul>
                                <li>Ưu tiên hoàn về phương thức thanh toán ban đầu.</li>
                                <li>Đơn COD: hoàn qua chuyển khoản hoặc credit Marketo.</li>
                                <li>Ghi có 3–7 ngày làm việc; có thông báo khi hoàn tất.</li>
                                <li>Điều chỉnh hoa hồng 5% tương ứng đơn hoàn.</li>
                            </ul>
                            <h3>9. Xử lý tranh chấp & vai trò Marketo</h3>
                            <ul>
                                <li>Marketo can thiệp khi có ticket + bằng chứng.</li>
                                <li>Có thể yêu cầu bổ sung ảnh/clip/serial, kiểm tra chat, kiểm tra chất lượng.</li>
                                <li>Quyết định: buộc hoàn tiền/đổi hàng, khóa cửa hàng/tài khoản nếu gian lận.</li>
                                <li>Tối đa 15 ngày; nếu cần thêm thời gian pháp lý sẽ thông báo.</li>
                            </ul>
                            <h3>10. Trường hợp gian lận & biện pháp xử lý</h3>
                            <ul>
                                <li>Cấm: hàng giả, đơn ảo, đánh giá giả, hoàn tiền gian dối.</li>
                                <li>Biện pháp: vô hiệu yêu cầu, trừ/bắt hoàn tiền, khóa tài khoản, báo cơ quan chức năng, cảnh báo hệ thống.</li>
                            </ul>
                            <h3>11. Hướng dẫn thực tế cho người mua</h3>
                            <ul>
                                <li>Kiểm tra bao bì/tem khi nhận; ghi chú nếu hư hỏng ngoại quan.</li>
                                <li>Chụp ảnh/ghi video mở hộp (với hàng giá trị).</li>
                                <li>Lập ticket + bằng chứng; liên hệ chat với người bán.</li>
                                <li>Giữ phiếu gửi và mã tracking cho đến khi hoàn tất.</li>
                            </ul>
                            <h3>12. Yêu cầu từ người bán</h3>
                            <ul>
                                <li>Cung cấp địa chỉ trả hàng rõ ràng trong hồ sơ.</li>
                                <li>Phản hồi trong 48 giờ.</li>
                                <li>Hướng dẫn đóng gói/địa chỉ trả về khi chấp nhận.</li>
                                <li>Cập nhật trạng thái để điều chỉnh thanh toán.</li>
                            </ul>
                            <h3>13. Hiệu lực & cập nhật chính sách</h3>
                            <ul>
                                <li>Có hiệu lực khi đăng tải; thay đổi sẽ thông báo và có hiệu lực theo ngày thông báo.</li>
                                <li>Tiếp tục sử dụng sau cập nhật đồng nghĩa đồng ý thay đổi.</li>
                            </ul>
                        </section>

                        <p className="text-xs text-slate-500 mt-8">© {new Date().getFullYear()} Marketo. Mọi quyền được bảo lưu.</p>
                    </div>
                </main>
            </div>
        </div>
    )
}
