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

API Bài 3 chưa có xác thực người dùng; Bài 4 bổ sung xác thực và kiểm tra quyền. Việc mở Atlas tới **0.0.0.0/0** chỉ nên dùng tạm trong bài lab và cần thu hẹp sau khi thực hành. Bucket public chỉ dành cho tệp mẫu không nhạy cảm.

## Bài 4 — xác thực và kiểm thử

Nhánh Bài 4 yêu cầu `JWT_SECRET` có ít nhất 32 byte, bên cạnh các biến MongoDB và Supabase trong `.env.example`. Đặt thông tin thật trong `.env` không được Git theo dõi hoặc trong biến môi trường. Chạy `npm install`, `npm run check`, `npm test` và `npm audit --omit=dev`. Bật server bằng `npm start`, sau đó trong terminal khác chạy `npm run security:smoke`: script tạo hai tài khoản thử có tên ngẫu nhiên, xác minh truy cập chéo và tự dọn dữ liệu do script tạo nếu kết nối database hoạt động. Script yêu cầu cùng MongoDB URI với server; không chạy trên database không được phép ghi thử.

`npm test` kiểm tra không token, đầu vào object và yêu cầu thứ 21 nhận 429 mà không cần database. `npm run smoke` cũ của Bài 3 chưa gửi token nên không dùng để chứng minh CRUD của Bài 4. Ghi chú cũ chưa gắn owner hợp lệ không tự hiện cho tài khoản mới; không chuyển quyền sở hữu nếu chưa xác định chủ sở hữu.

Bucket `attachments` hiện là Public: người có URL vẫn đọc được tệp, ngay cả khi không được API cấp quyền. Muốn bảo mật tệp thật cần bucket private và cơ chế cung cấp URL ký sau khi kiểm tra quyền. `trust proxy = 1` phù hợp khi có đúng một reverse proxy đáng tin cậy; điều chỉnh theo môi trường khi triển khai.

## Bài 4 — quét Docker image và thu thập minh chứng

Có thể chạy không cần Codespaces bằng GitHub Actions: mở tab **Actions**, chọn workflow **Lab 4 security and Trivy**, chọn nhánh **bai-4-api-security** nếu có nút Run workflow. Workflow chạy khi push lên nhánh Bài 4; nếu GitHub chưa hiển thị workflow để chạy thủ công trên nhánh chưa merge, dùng run được kích hoạt từ push.

Workflow không dùng thông tin kết nối Atlas/Supabase. Nó chạy npm ci, kiểm tra cú pháp, kiểm thử HTTP không cần DB, npm audit và Trivy trên hai Docker image. Tải artifact **lab04-results**, đọc file **trivy-comparison.md**, chụp màn hình trang Summary/log của lần chạy thật. Không coi workflow thành công là bằng chứng đã kiểm thử ownership trên Atlas.

Hoặc chạy tại máy có Docker:

~~~bash
npm ci
npm run check
npm test
npm audit --omit=dev
bash scripts/trivy-scan.sh /tmp/lab04-scan
~~~

Script lấy dung lượng thực tế từ docker image inspect và đếm HIGH/CRITICAL trong kết quả JSON Trivy. Các file kết quả, thời điểm quét và image ID được lưu trong thư mục đầu ra.

Với Codespaces Secrets: cấu hình MONGODB_URI, SUPABASE_URL, SUPABASE_SERVICE_KEY và JWT_SECRET trong tài khoản chạy Codespaces, cấp quyền cho repo, rebuild/restart môi trường và xác nhận biến tồn tại mà không in giá trị. Các biến của tài khoản khác không tự chuyển sang. Sau khi xác nhận đầy đủ, xóa .env tại môi trường thực hành.

Kiểm thử Atlas: chạy npm start và npm run security:smoke ở terminal khác. Cần credentials hợp lệ, database dành cho lab. Không in token hoặc key trong ảnh. Kiểm thử đăng nhập thứ 21 dùng lượt test riêng vì rate limit áp dụng cho toàn bộ /auth, kể cả register.

Xem mẫu báo cáo và danh sách minh chứng: [docs/BAO_CAO_BAI_4.md](docs/BAO_CAO_BAI_4.md).
