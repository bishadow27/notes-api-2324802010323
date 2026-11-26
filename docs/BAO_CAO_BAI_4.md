# Báo cáo Bài 4 — Bảo mật API

Sinh viên: Nguyễn Duy Phúc — MSSV: 2324802010323.

## Kết quả xác minh trên máy

| Kiểm tra | Kết quả |
| --- | --- |
| npm test | Bản ghi trước đây báo PASS 3 kiểm thử; cần chạy lại sau khi cập nhật test để xác minh 401 và 429 chính xác ở yêu cầu thứ 21 |
| npm run check | PASS: kiểm tra cú pháp theo script hiện có của Bài 3 |
| npm audit --omit=dev | PASS: 0 lỗ hổng được báo cáo |
| Quét lịch sử Git | Không tìm thấy chuỗi khớp một số mẫu MongoDB URI, Supabase secret và JWT; không kết luận chắc chắn không có bí mật |
| Đăng ký, đăng nhập và phân quyền chéo với Atlas | CHƯA CHẠY: chưa cấu hình thông tin kết nối trên máy |
| Trivy Alpine và full | CHƯA CHẠY: chưa có Docker CLI/daemon trên máy; không có số liệu để báo cáo |
| Push protection và Dependabot | CHƯA XÁC MINH |

## Đánh giá Network Access

| Rủi ro | Biện pháp bù trừ | Phương án tốt hơn |
| --- | --- | --- |
| 0.0.0.0/0 cho phép mọi địa chỉ IP thử kết nối, làm tăng nguy cơ dò mật khẩu và bị truy cập nếu lộ thông tin xác thực. | Quyền user chỉ readWrite database notes; TLS, mật khẩu đủ mạnh, giữ secret ngoài mã và đổi khi lộ. | Giới hạn IP cố định hoặc Private Endpoint/VPC peering nếu dịch vụ và chi phí cho phép. |

## Câu hỏi phản biện

1. JWT còn hạn có thể bị người giữ sử dụng đến khi hết hạn; máy chủ không thể thu hồi từng token nếu chỉ xác minh chữ ký. Có thể dùng danh sách thu hồi hoặc phiên lưu phía server; đổi lại cần bộ nhớ, tra cứu và vận hành hạ tầng trạng thái.
2. Alpine thường ít gói hơn nên có ít thành phần được công cụ báo lỗi hơn. Số cảnh báo ít không chứng minh an toàn: phụ thuộc cơ sở dữ liệu lỗ hổng, cấu hình, mã ứng dụng và các thành phần chưa được phát hiện.
3. Nhà cung cấp chịu trách nhiệm vận hành hạ tầng dịch vụ theo phạm vi cam kết; nhóm phát triển chịu trách nhiệm cấu hình quyền và mạng, bảo vệ secret, xác thực, phân quyền và bảo mật mã ứng dụng.

## Lưu ý triển khai

Thiết lập JWT_SECRET bằng ít nhất 32 byte ngẫu nhiên và cung cấp các biến Atlas/Supabase qua môi trường hoặc .env không được theo dõi. Ghi chú seed cũ không có owner của tài khoản mới nên không tự hiển thị sau khi bật xác thực; không tự ý chuyển quyền sở hữu dữ liệu. Bucket attachments đang Public: bất kỳ ai có URL có thể xem tệp, dù API đã kiểm tra quyền sở hữu. Muốn bảo vệ tệp phải dùng bucket private và URL ký có thời hạn.

Script smoke của Bài 3 kiểm thử API không xác thực nên cần cập nhật trước khi chạy cho Bài 4. Chưa chạy thử dịch vụ thực tế; không đánh dấu hoàn tất bài.

## Phần C — Bảng kết quả quét lỗ hổng

Chạy `bash scripts/trivy-scan.sh /tmp/lab04-scan` hoặc lấy artifact `lab04-results` từ workflow GitHub Actions. Điền từ `trivy-comparison.md`, không ước lượng.

| Image | Kích thước (MiB) | HIGH | CRITICAL |
| --- | ---: | ---: | ---: |
| node:22-alpine | Chưa đo | Chưa đo | Chưa đo |
| node:22 | Chưa đo | Chưa đo | Chưa đo |

Thời điểm quét (UTC): [điền từ scan-utc.txt].

Đơn vị: 1 MiB = 1.048.576 byte, kích thước lấy từ Docker image inspect. Số cảnh báo đếm từng mục lỗ hổng Trivy trên các target, không khử trùng lặp giữa target. Ưu tiên đánh giá CRITICAL trước HIGH, khả năng bị khai thác, mức ảnh hưởng, bản sửa khả dụng; không chỉ dựa vào tổng số.

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
