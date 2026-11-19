# Sơ đồ so sánh MongoDB Atlas và HDFS

~~~mermaid
flowchart LR
  subgraph A[MongoDB Atlas - Replica Set 3 nút]
    direction TB
    API[Ứng dụng / API] --> P[(Primary)]
    P -->|Nhân bản dữ liệu và thao tác ghi| S1[(Secondary 1)]
    P -->|Nhân bản dữ liệu và thao tác ghi| S2[(Secondary 2)]
  end

  subgraph H[HDFS - Nhân bản từng block]
    direction TB
    C[HDFS Client] --> N[NameNode: metadata và vị trí block]
    C --> D1[DataNode 1: block A]
    D1 -->|Replica block A| D2[DataNode 2: block A]
    D1 -->|Replica block A| D3[DataNode 3: block A]
  end
~~~

## Điểm giống và khác

| Tiêu chí | MongoDB Atlas | HDFS |
|---|---|---|
| Mục tiêu | Duy trì dữ liệu và khả năng phục vụ khi một nút gặp lỗi | Bảo vệ block dữ liệu khi DataNode gặp lỗi |
| Đơn vị nhân bản | Bản sao dữ liệu của replica set | Từng block của tệp |
| Thành phần điều phối | Primary nhận ghi; Secondary sao chép thay đổi | NameNode quản lý metadata; DataNode lưu block |
| Số lượng 3 | Cụm Atlas Free có ba nút replica set | HDFS thường cấu hình replication factor bằng 3 cho mỗi block |
| Khi một nút lỗi | Replica set có thể bầu Primary mới nếu còn đa số | Các bản sao block còn lại vẫn có thể phục vụ |

**Lưu ý:** NameNode không tương đương Primary của MongoDB. NameNode quản lý metadata và vị trí block; Primary là nút cơ sở dữ liệu nhận thao tác ghi.

## Nhận xét

Hai hệ thống cùng dùng nhân bản để tăng khả năng chịu lỗi và duy trì khả năng truy cập dữ liệu. Khác biệt nằm ở đơn vị được nhân bản: Atlas sao chép dữ liệu của cơ sở dữ liệu giữa các thành viên replica set, còn HDFS sao chép từng block của tệp giữa các DataNode.

Nguồn tham khảo:
- https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html
