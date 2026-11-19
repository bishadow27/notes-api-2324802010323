# LING270 - Thực hành Điện toán đám mây

Repository này lưu bài thực hành của Nguyễn Duy Phúc (MSSV 2324802010323).

- **Bài 1:** Hello Cloud API bằng Express và GitHub Codespaces.
- **Bài 2:** Docker Container, GHCR và mô phỏng CloudSim Plus. Báo cáo và minh chứng hiện có trong **docs/index.html** và **docs/lab02-evidence/**.
- **Bài 3:** MongoDB Atlas (NoSQL), Supabase Storage (object storage), CRUD API và đo hiệu quả chỉ mục.

## Bài 3 - Thiết lập dịch vụ

1. MongoDB Atlas: tạo project **cloud-lab**, cluster Free, vùng Singapore nếu có. Tạo database user **notes_app** với quyền **readWrite** trên database **notes**.
2. Supabase: tạo project, tạo bucket **attachments**, bật Public để kiểm tra URL trong bài thực hành.
3. Sao chép **.env.example** thành **.env** và điền thông tin kết nối. Không commit **.env**.

~~~bash
cp .env.example .env
npm install
~~~

Lệnh **npm install** sẽ cập nhật **package-lock.json** để đồng bộ các phụ thuộc mới. Hãy commit cả **package.json** và **package-lock.json** sau khi cài đặt. Việc này cần thiết vì Dockerfile hiện dùng **npm ci**.

Ví dụ cấu hình:

~~~text
PORT=3000
MONGODB_URI=mongodb+srv://notes_app:<PASSWORD>@<CLUSTER>.mongodb.net/notes?retryWrites=true&w=majority
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_SERVICE_KEY=<SUPABASE_SECRET_OR_SERVICE_ROLE_KEY>
~~~

Khóa Supabase secret/service_role chỉ được dùng ở phía máy chủ. Nếu mật khẩu MongoDB có ký tự đặc biệt, cần URL-encode khi đặt trong URI.

## Bài 3 - Chạy API và kiểm thử

~~~bash
npm run check
npm start
~~~

Mở terminal thứ hai:

~~~bash
npm run smoke
~~~

Script smoke test kiểm tra CRUD, mã HTTP 201/200/204/400/404 và upload tệp. Tệp upload kiểm thử được giữ lại trên bucket để mở URL làm minh chứng; có thể xóa thủ công sau khi chụp ảnh.

## Bài 3 - Đo chỉ mục

~~~bash
npm run seed
npm run explain
~~~

- **seed:** xóa riêng các ghi chú có owner bằng **seed**, sau đó chèn 2.000 ghi chú mẫu.
- **explain:** so sánh COLLSCAN (ép bằng **$natural**) và IXSCAN (ép bằng chỉ mục **tags_1**), in **docsExamined**, **nReturned**, thời gian và tỉ số giảm số tài liệu phải kiểm tra.

## API endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | / | Hello Cloud API từ Bài 1 |
| GET | /notes | Danh sách 50 ghi chú mới nhất |
| GET | /notes?tag=nosql | Lọc theo tag |
| GET | /notes/:id | Xem một ghi chú |
| POST | /notes | Tạo ghi chú, trả 201 |
| PUT | /notes/:id | Cập nhật ghi chú |
| DELETE | /notes/:id | Xóa ghi chú, trả 204 |
| POST | /notes/:id/attachment | Tải tệp ở multipart field file, tối đa 2 MB |

## Tài liệu Bài 3

- [Mẫu báo cáo Bài 3](docs/BAO_CAO_BAI_3.md)
- [Sơ đồ và so sánh Atlas - HDFS](docs/so-sanh-atlas-hdfs.md)
- [Sơ đồ SVG](docs/so-sanh-atlas-hdfs.svg)

## Lưu ý bảo mật

API thực hành chưa có xác thực người dùng. Không triển khai công khai lâu dài khi chưa bổ sung authentication/authorization. Việc mở Atlas tới **0.0.0.0/0** chỉ nên dùng tạm trong bài lab và cần thu hẹp sau khi thực hành. Bucket public chỉ dành cho tệp mẫu không nhạy cảm.
