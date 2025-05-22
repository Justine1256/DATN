# Cấu trúc thư mục dự án Front-end (Next.js)

Dự án này được xây dựng bằng Next.js và tuân theo cấu trúc thư mục sau để quản lý các thành phần và logic của ứng dụng.

## Thư mục gốc

- **`public/`**: Chứa các tài sản tĩnh (static assets) như hình ảnh, fonts, và các file khác không cần xử lý bởi Next.js.

## Thư mục `src/`

Đây là thư mục chứa mã nguồn chính của ứng dụng.

### `src/app/`

_(Sử dụng App Router mới của Next.js 13+)_

Thư mục này định nghĩa các routes và layouts của ứng dụng.

- **(shop)/**: Một _route group_ chứa các trang liên quan đến cửa hàng.
  - `layout.js` (hoặc `.tsx`): Layout cụ thể áp dụng cho tất cả các trang bên trong group `(shop)`.
  - `page.js` (hoặc `.tsx`): File route component cho trang chủ của cửa hàng.
  - `product/[slug]/`: Dynamic route cho trang chi tiết của từng sản phẩm. `[slug]` là một tham số động trong URL (ví dụ: `/product/ten-san-pham`).
    - `page.js` (hoặc `.tsx`): Component hiển thị chi tiết sản phẩm dựa trên `slug`.
  - `cart/`: Route cho trang giỏ hàng.
    - `page.js` (hoặc `.tsx`): Component hiển thị nội dung giỏ hàng.
  - `checkout/`: Route cho trang thanh toán.
    - `page.js` (hoặc `.tsx`): Component cho quy trình thanh toán.
  - `search/`: Route cho trang kết quả tìm kiếm.
    - `page.js` (hoặc `.tsx`): Component hiển thị kết quả tìm kiếm.
  - `... (các trang khác liên quan đến cửa hàng)`: Các trang khác như trang danh mục sản phẩm, trang tài khoản, v.v.
- `layout.js` (hoặc `.tsx`): Layout chung áp dụng cho toàn bộ ứng dụng.
- `page.js` (hoặc `.tsx`): File route component cho trang chủ của ứng dụng (có thể là trang giới thiệu trước khi vào cửa hàng).
- `... (các route khác)`: Các route khác không thuộc group `(shop)`.

### `src/components/`

Thư mục này chứa các React components có thể tái sử dụng trong toàn bộ ứng dụng.

- `common/`: Các component dùng chung, thường xuất hiện trên nhiều trang (ví dụ: Header, Footer, Navigation).
- `home/`: Các component đặc biệt được sử dụng riêng cho trang chủ.
- `product/`: Các component liên quan đến việc hiển thị thông tin sản phẩm (ví dụ: ProductCard, ProductDetails).
- `cart/`: Các component dành riêng cho trang giỏ hàng (ví dụ: CartItem, CartSummary).
- `checkout/`: Các component phục vụ quy trình thanh toán (ví dụ: CheckoutForm, OrderSummary).
- `ui/`: Các component UI cơ bản và có tính tái sử dụng cao (ví dụ: Button, Card, InputField), thường được style bằng Tailwind CSS hoặc Bootstrap.

### `src/hooks/`

Chứa các custom React hooks để xử lý các logic phức tạp hoặc logic có thể tái sử dụng giữa các component.

- `useAuth.js` (hoặc `.tsx`): Hook xử lý logic liên quan đến xác thực người dùng.
- `useCart.js` (hoặc `.tsx`): Hook quản lý trạng thái và logic của giỏ hàng.
- `useFetch.js` (hoặc `.tsx`): Hook để thực hiện các yêu cầu API.
- `... (các custom hooks khác)`: Các hook tùy chỉnh khác cho các chức năng cụ thể.

### `src/lib/`

Chứa các thư viện và các hàm tiện ích (utility functions) dùng trong dự án.

- `api.js` (hoặc `.tsx`): Các hàm để gọi API backend.
- `constants.js` (hoặc `.tsx`): Định nghĩa các hằng số được sử dụng trong ứng dụng.
- `helpers.js` (hoặc `.tsx`), `utils.js` (hoặc `.tsx`): Các hàm tiện ích chung.
- `... (các thư viện hoặc utility functions khác)`: Các module hoặc hàm tiện ích khác.

### `src/styles/`

Chứa các file CSS để định стилизация cho ứng dụng.

- `globals.css`: Các style CSS toàn cục áp dụng cho toàn bộ ứng dụng.
- `*.module.css`: CSS Modules là các file CSS được scoped cho từng component hoặc trang, giúp tránh xung đột style. Ví dụ: `Home.module.css`, `ProductDetails.module.css`.

## Các file cấu hình

- `next.config.js`: File cấu hình tùy chỉnh cho Next.js.
- `package.json`, `package-lock.json`: Quản lý các dependencies và phiên bản của các thư viện npm được sử dụng trong dự án.
- `README.md`: File này (bạn đang đọc nó). Cung cấp thông tin tổng quan về dự án, cấu trúc thư mục, và các hướng dẫn khác.
- `tsconfig.json` (nếu sử dụng TypeScript): File cấu hình cho trình biên dịch TypeScript.

---

Đây là cấu trúc thư mục được tổ chức để giúp quản lý một trang web thương mại điện tử xây dựng bằng Next.js. Nó tách biệt rõ ràng các routes, layouts, components, hooks, utilities và styles, giúp dự án dễ bảo trì và mở rộng hơn.


// ✅ ĐÃ XONG api crud sản phẩm, danh mục, top 10 sp bán chạy, top 10 sp giảm nhiều, đăng nhập đăng ký, crud user, crud giỏ hàng