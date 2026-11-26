# Báo cáo Bài 4 — Bảo mật API

Sinh viên: Nguyễn Duy Phúc — MSSV: 2324802010323.

## Kết quả xác minh trên máy

| Kiểm tra | Kết quả |
| --- | --- |
| npm ci, npm run check | PASS: cài đúng lockfile và kiểm tra cú pháp các tệp trong script |
| npm test | PASS: 4 kiểm thử; không token, token sai/hết hạn 401; kiểm tra header Helmet; yêu cầu 1–20 nhận 401 và yêu cầu 21 nhận 429 |
| npm audit --omit=dev | PASS: 0 lỗ hổng được báo cáo |
| Quét lịch sử Git | Sau khi lấy các nhánh, `git log --all -p` không có chuỗi khớp một số mẫu MongoDB URI, Supabase secret và JWT; phương pháp này không phát hiện mọi loại bí mật |
| Đăng ký, đăng nhập và phân quyền chéo với Atlas | PASS trong Codespace: đăng ký 201, đăng nhập 200; thiếu, sai hoặc hết hạn token 401; người B truy cập GET/PUT/DELETE/upload ghi chú của A nhận 404; đầu vào NoSQL injection nhận 401. Script dọn tài khoản và ghi chú thử. |
| Upload của chủ ghi chú | PASS trong Codespace: `node scripts/upload-smoke.js` dùng JWT hợp lệ, upload HTTP 200; `attachmentUrl` HTTP 200 và nội dung đúng. Tệp thử đã được nhìn thấy trong bucket `attachments`; tài khoản và ghi chú thử được dọn. |
| Trivy Alpine và full | PASS: quét thực tế bằng GitHub Actions, chi tiết ở phần C |
| Secret Protection và Push protection | Đã bật; xác nhận tại Settings → Advanced Security ngày 26/11/2026 |
| Dependabot alerts | Đã bật cùng dependency graph ngày 26/11/2026; trạng thái danh sách cảnh báo cần kiểm tra riêng |
| Codespaces Secrets | Tài khoản DuyPhuc-323 đã có SUPABASE_URL cho repository; ba secret còn lại chưa được xác nhận. Codespace hiện vẫn dùng .env riêng. |

## Đánh giá Network Access

| Rủi ro | Biện pháp bù trừ | Phương án tốt hơn |
| --- | --- | --- |
| 0.0.0.0/0 cho phép mọi địa chỉ IP thử kết nối, làm tăng nguy cơ dò mật khẩu và bị truy cập nếu lộ thông tin xác thực. | Quyền user chỉ readWrite database notes; TLS, mật khẩu đủ mạnh, giữ secret ngoài mã và đổi khi lộ. | Giới hạn IP cố định hoặc Private Endpoint/VPC peering nếu dịch vụ và chi phí cho phép. |

Nếu mật khẩu bị lộ, đối tượng khác có thể đọc hoặc sửa dữ liệu trong phạm vi quyền của user `notes_app`; TLS không ngăn người đã có mật khẩu hợp lệ đăng nhập. Giới hạn IP cố định cần nguồn IP ổn định và duy trì allowlist; Codespaces có IP thay đổi. Private Endpoint và VPC peering cần kiểm tra hỗ trợ gói, mạng và chi phí thực tế; chưa triển khai ở đây. Mật khẩu từng được chia sẻ trong hội thoại nên cần thay bằng mật khẩu ngẫu nhiên mới; chưa khẳng định đã thay.

## Câu hỏi phản biện

1. JWT còn hạn có thể bị người giữ sử dụng đến khi hết hạn; máy chủ không thể thu hồi từng token nếu chỉ xác minh chữ ký. Có thể dùng danh sách thu hồi hoặc phiên lưu phía server; đổi lại cần bộ nhớ, tra cứu và vận hành hạ tầng trạng thái.
2. Alpine thường ít gói hơn nên có ít thành phần được công cụ báo lỗi hơn. Số cảnh báo ít không chứng minh an toàn: phụ thuộc cơ sở dữ liệu lỗ hổng, cấu hình, mã ứng dụng và các thành phần chưa được phát hiện.
3. Nhà cung cấp chịu trách nhiệm vận hành hạ tầng dịch vụ theo phạm vi cam kết; nhóm phát triển chịu trách nhiệm cấu hình quyền và mạng, bảo vệ secret, xác thực, phân quyền và bảo mật mã ứng dụng.

## Lưu ý triển khai

Thiết lập JWT_SECRET bằng ít nhất 32 byte ngẫu nhiên và cung cấp các biến Atlas/Supabase qua môi trường hoặc .env không được theo dõi. Ghi chú seed cũ không có owner của tài khoản mới nên không tự hiển thị sau khi bật xác thực; không tự ý chuyển quyền sở hữu dữ liệu. Bucket attachments đang Public: bất kỳ ai có URL có thể xem tệp, dù API đã kiểm tra quyền sở hữu. Muốn bảo vệ tệp phải dùng bucket private và URL ký có thời hạn.

Script smoke của Bài 3 kiểm thử API không xác thực nên cần cập nhật trước khi chạy cho Bài 4. Kiểm thử Bài 4 dùng Atlas và upload hợp lệ lên Supabase đã PASS. Tệp upload mẫu được giữ trong bucket Public để đối chiếu; ảnh minh chứng và chạy không cần .env vẫn chưa hoàn tất.

## Phần C — Bảng kết quả quét lỗ hổng

Chạy `bash scripts/trivy-scan.sh /tmp/lab04-scan` hoặc lấy artifact `lab04-results` từ workflow GitHub Actions. Điền từ `trivy-comparison.md`, không ước lượng.

| Image | Kích thước (MiB) | HIGH | CRITICAL |
| --- | ---: | ---: | ---: |
| Ứng dụng từ node:22-alpine | 68,15 | 10 | 0 |
| Ứng dụng từ node:22 | 399,20 | 479 | 20 |

Thời điểm quét: 2026-11-26 06:46:19 UTC (13:46:19 giờ Việt Nam). [GitHub Actions run 45770439122](https://github.com/bishadow27/notes-api-2324802010323/actions/runs/45770439122) chạy thành công tại commit 971fc4c. Trivy image `aquasec/trivy:latest` có digest `sha256:8f6bb947dbc528902e11f2f5be52f7b519f6a39d5d148f41166f2040499768fb`. Hai image là image ứng dụng được build từ hai base image tương ứng, không phải kích thước base image thuần.

Đơn vị: 1 MiB = 1.048.576 byte, kích thước lấy từ Docker image inspect. Số cảnh báo đếm từng mục lỗ hổng Trivy trên các target, không khử trùng lặp giữa target. Ưu tiên đánh giá CRITICAL trước HIGH, khả năng bị khai thác, mức ảnh hưởng, bản sửa khả dụng; không chỉ dựa vào tổng số.

Kết quả cho thấy image dùng Alpine có bề mặt gói được báo cáo nhỏ hơn trong lần quét này. Với 20 mục CRITICAL ở image đầy đủ, cần đọc từng CVE trong artifact để xác định gói, đường khai thác và bản vá trước khi ưu tiên; không suy ra tất cả đều khai thác được qua API. Lần quét không chứng minh image không có lỗ hổng chưa được công bố.

## Minh chứng Bài 4

Lưu ảnh thật vào `docs/lab04-evidence/` hoặc cung cấp ảnh tải xuống từ lần chạy thực tế:

- `01-secrets.png`: danh sách bốn Codespaces Secrets, không hiện giá trị.
- `02-push-protection.png`: Secret Protection/Push protection và Dependabot alerts.
- `03-git-history.png`: kết quả quét lịch sử đã che bí mật; nếu thấy key thật phải đổi ngay.
- `04-security-tests.png`: không token 401, đầu vào object 401, lần 20 là 401 và lần 21 là 429.
- `05-owner-isolation.png`: `npm run security:smoke` thực tế trên Atlas, người B nhận 404.
- `06-npm-audit.png`: kết quả audit thực tế.
- `07-trivy-scan.png`: bảng so sánh image, HIGH, CRITICAL từ lần quét thực.
- `08-dependabot.png`: tab Security/Dependabot.
- `09-github-commit.png`: commit `Bai 4` và nhánh tương ứng.

Không dùng ảnh minh họa hoặc ảnh terminal giả. Nếu chưa chạy hoặc không có quyền truy cập, ghi rõ chưa thực hiện.
