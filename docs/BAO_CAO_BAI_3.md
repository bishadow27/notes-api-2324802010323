# BÁO CÁO THỰC HÀNH BÀI 3
## Lưu trữ phân tán: NoSQL và lưu trữ đối tượng

**Học phần:** LING270 - Thực hành Điện toán đám mây  
**Sinh viên:** Nguyễn Duy Phúc  
**MSSV:** 2324802010323  
**Repository:** https://github.com/bishadow27/notes-api-2324802010323

## 1. Mô hình triển khai

Ứng dụng sử dụng Express 5 làm API. MongoDB Atlas lưu dữ liệu ghi chú theo mô hình NoSQL. Tệp đính kèm được tải lên bucket **attachments** trên Supabase Storage; MongoDB chỉ lưu đường dẫn công khai **attachmentUrl**.

![Sơ đồ Atlas và HDFS](so-sanh-atlas-hdfs.svg)

## 2. Minh chứng kiểm thử API

Chạy **npm run smoke** sau khi API kết nối thành công với MongoDB Atlas và Supabase. Điền kết quả thực tế:

| Tình huống | Mã HTTP mong đợi | Kết quả thực tế |
|---|---:|---|
| GET / | 200 | [Điền] |
| POST /notes | 201 | [Điền] |
| GET /notes và GET /notes/:id | 200 | [Điền] |
| PUT /notes/:id | 200 | [Điền] |
| DELETE /notes/:id | 204 | [Điền] |
| GET ghi chú đã xóa | 404 | [Điền] |
| ID không hợp lệ / thiếu title | 400 | [Điền] |
| POST /notes/:id/attachment | 200 | [Điền] |
| Mở attachmentUrl | 200 | [Điền] |

## 3. Kết quả đo hiệu quả chỉ mục

Chạy **npm run seed** để thêm 2.000 ghi chú mẫu, sau đó chạy **npm run explain**. Chụp màn hình kết quả terminal và điền số liệu:

| Phương pháp | docsExamined | nReturned | executionTimeMillis |
|---|---:|---:|---:|
| Quét toàn bộ (COLLSCAN) | [Điền] | [Điền] | [Điền] |
| Dùng chỉ mục (IXSCAN) | [Điền] | [Điền] | [Điền] |

**Tỉ số giảm số tài liệu phải kiểm tra:**

docsExamined(COLLSCAN) / docsExamined(IXSCAN) = **[Điền] lần**.

Ưu tiên đánh giá **docsExamined**. Thời gian thực thi trên 2.000 tài liệu có thể chênh lệch nhỏ và chịu ảnh hưởng của độ trễ mạng, cache và tải cụm.

## 4. Trả lời câu hỏi phản biện

### Câu 1. Với 2.000 tài liệu, chênh lệch thời gian nhỏ. Điều gì xảy ra với 2 triệu tài liệu và giới hạn 100 thao tác/giây?

Nếu phân bố dữ liệu và tỉ lệ xuất hiện tag **docker** giữ nguyên, truy vấn COLLSCAN có thể phải kiểm tra gần 2 triệu tài liệu. Truy vấn dùng chỉ mục chỉ cần kiểm tra các tài liệu phù hợp với tag đó. Có thể ước lượng số tài liệu phải kiểm tra bằng tỉ lệ đo được ở mục 3.

Giới hạn 100 thao tác/giây là giới hạn mức thao tác đọc/ghi của gói miễn phí, không có nghĩa một truy vấn quét 2 triệu tài liệu bị tính thành 2 triệu thao tác API. Dù vậy, truy vấn quét lớn tiêu tốn tài nguyên và có thể làm giảm thông lượng khi nhiều truy vấn chạy đồng thời.

### Câu 2. Vì sao lưu tệp trên Supabase Storage rồi chỉ lưu URL trong MongoDB?

Supabase Storage được thiết kế để lưu và phân phối đối tượng như ảnh, PDF hoặc tệp đính kèm. MongoDB chỉ lưu thông tin ghi chú và URL nên tài liệu gọn hơn, dễ truy vấn và lập chỉ mục. Cách tách này cũng tránh đưa dữ liệu nhị phân lớn vào tài liệu BSON. Với bài thực hành, bucket public giúp kiểm tra URL trực tiếp; không dùng bucket public cho dữ liệu cá nhân hoặc nhạy cảm.

### Câu 3. Atlas nhân bản 3 nút; HDFS mặc định nhân bản 3 block. Mục tiêu chung là gì và đơn vị nhân bản khác nhau ra sao?

Mục tiêu chung là tăng khả năng chịu lỗi và duy trì khả năng truy cập dữ liệu khi một nút hoặc thiết bị lưu trữ gặp sự cố. Atlas nhân bản dữ liệu của replica set giữa Primary và Secondary. HDFS nhân bản từng block của tệp giữa các DataNode. NameNode quản lý metadata, không phải một bản sao dữ liệu block.

## 5. Ảnh cần nộp

- [ ] Ảnh terminal chạy **npm run smoke** với các kết quả PASS.
- [ ] Ảnh terminal chạy **npm run explain** có bảng **docsExamined**.
- [ ] Ảnh Atlas Overview/Metrics thể hiện replica set ba nút.
- [ ] Ảnh bucket **attachments** có tệp thử và ảnh mở **attachmentUrl**.
- [ ] Ảnh GitHub commit có thông điệp **Bai 3**.
- [ ] Ảnh **git status** chứng minh không có tệp **.env**.

**Ghi chú:** Không tự điền số liệu đo hoặc đánh dấu PASS trước khi chạy trên dịch vụ thật. Ảnh minh chứng phải lấy từ môi trường thực hành của sinh viên.
