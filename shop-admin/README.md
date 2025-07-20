This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


✅ Dưới đây là một README.md mẫu chuẩn chỉnh cho dự án Laravel của bạn (backend), có ghi rõ: yêu cầu, cài đặt, chạy local, deploy, và lưu ý extension gd và các extension khác.

Bạn có thể copy nguyên vào repo nhé:

📦 DATN Laravel Backend
Backend của dự án DATN, viết bằng Laravel.
Cung cấp API cho frontend (Next.js) và hỗ trợ xuất PDF hóa đơn.

🔧 Yêu cầu hệ thống
PHP >= 8.1

Composer >= 2.x

MySQL/MariaDB

Các PHP extensions:

gd (bắt buộc, để xuất PDF, xử lý ảnh)

mbstring

openssl

pdo

tokenizer

xml

ctype

bcmath

🚀 Cài đặt và chạy local
1️⃣ Clone repo:

bash
Sao chép
Chỉnh sửa
git clone <repo-url>
cd DATN-main/back-end
2️⃣ Cài đặt dependencies:

bash
Sao chép
Chỉnh sửa
composer install
3️⃣ Tạo file cấu hình .env:

bash
Sao chép
Chỉnh sửa
cp .env.example .env
4️⃣ Thiết lập database trong .env:

makefile
Sao chép
Chỉnh sửa
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=datn
DB_USERNAME=root
DB_PASSWORD=
5️⃣ Generate application key:

bash
Sao chép
Chỉnh sửa
php artisan key:generate
6️⃣ Chạy migration (và seed nếu có):

bash
Sao chép
Chỉnh sửa
php artisan migrate --seed
7️⃣ Chạy server:

bash
Sao chép
Chỉnh sửa
php artisan serve
Mặc định sẽ chạy ở: http://localhost:8000

📝 Kiểm tra extension PHP (quan trọng)
Đảm bảo server hoặc local có gd:

bash
Sao chép
Chỉnh sửa
php -m | grep gd
Nếu chưa có, cài:

Ubuntu/Debian:

bash
Sao chép
Chỉnh sửa
sudo apt install php-gd
sudo service php8.x-fpm restart
CentOS:

bash
Sao chép
Chỉnh sửa
sudo yum install php-gd
sudo systemctl restart php-fpm
📄 API Docs
Các endpoint API có thể test bằng Postman hoặc curl.
File collection Postman: (bạn có thể đính kèm ở đây nếu có)

🚀 Deploy
Khi deploy lên server:

Đảm bảo môi trường PHP trên server đã bật các extensions yêu cầu.

Chạy lại:

bash
Sao chép
Chỉnh sửa
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
👨‍💻 Thông tin
Chủ dự án: [Tên bạn hoặc team]

Liên hệ: [email, zalo, slack…]

📌 Nếu muốn mình làm thêm file cho Frontend (Next.js) hoặc kèm cả quy trình CI/CD thì cứ bảo nhé!
Chúc bạn deploy và làm việc thuận lợi. 🚀