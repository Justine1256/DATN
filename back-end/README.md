LỆNH CƠ BẢN KHI CLONE GIT VỀ MÁY

1. Cài đặt dependencies (thư viện PHP)
composer install
Tải và cài đặt các package PHP được khai báo trong composer.json.

2. Tạo file cấu hình môi trường
cp .env.example .env
Tạo file .env từ mẫu .env.example.

Sau đó bạn chỉnh sửa file .env để cấu hình database, cache, mail, v.v...

3. Tạo key ứng dụng
php artisan key:generate
Tạo khóa bí mật cho ứng dụng, được lưu trong .env (APP_KEY).

Bắt buộc để Laravel chạy.

4. Tạo và chạy migration (tạo bảng trong database)
php artisan migrate
Tạo bảng trong database theo các file migration.

Nếu muốn reset và làm lại từ đầu:
php artisan migrate:fresh

5. Seed dữ liệu mẫu (nếu có)
php artisan db:seed
Chèn dữ liệu mẫu vào database, theo các Seeder đã viết.

Hoặc seed từng class cụ thể:
php artisan db:seed --class=UserSeeder

6. (Tùy chọn) Chạy server local
php artisan serve
Khởi động server PHP tích hợp để test app tại địa chỉ http://localhost:8000
