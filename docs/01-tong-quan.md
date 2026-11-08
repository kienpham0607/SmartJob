# 1. Tổng quan bài toán và yêu cầu

## Bối cảnh

Ứng viên thường phải đọc nhiều tin tuyển dụng để đối chiếu kỹ năng, kinh nghiệm và địa điểm. Nhà tuyển dụng cần đăng tin, xem hồ sơ và theo dõi xét duyệt tại một nơi. SmartJob kết hợp tìm kiếm chủ động với gợi ý dựa trên hồ sơ, đồng thời dùng bài toán này để minh họa kiến trúc hướng dịch vụ.

Mục tiêu của đồ án là xây dựng một hệ thống local có dữ liệu bền vững, giao tiếp HTTP thật giữa các service và khả năng giải thích từng điểm gợi ý. Recommendation là thuật toán theo luật, không phải mô hình học máy được huấn luyện.

## Tác nhân

| Tác nhân       | Quyền chính                                                                             |
| -------------- | --------------------------------------------------------------------------------------- |
| Khách          | Xem/tìm kiếm công việc, xem chi tiết, đăng ký, đăng nhập                                |
| CANDIDATE      | Quản lý hồ sơ bản thân, nhận gợi ý, ứng tuyển, xem đơn của bản thân                     |
| RECRUITER      | Quản lý hồ sơ công ty, đăng/sửa/xóa/đóng/mở tin của mình, xét duyệt ứng viên của tin đó |
| Service nội bộ | Truy cập contract `/internal` sau khi xác thực service token                            |

Không có vai trò quản trị trong phạm vi đồ án. Vai trò chỉ được chọn khi đăng ký; API cập nhật hồ sơ không cho đổi role.

## Yêu cầu chức năng

| Mã  | Yêu cầu                                                       | Điểm triển khai                                 |
| --- | ------------------------------------------------------------- | ----------------------------------------------- |
| F01 | Đăng ký email duy nhất, đăng nhập, JWT có hạn                 | User Service                                    |
| F02 | Xem/sửa hồ sơ, kỹ năng, kinh nghiệm, vị trí và địa điểm       | User Service                                    |
| F03 | Hồ sơ công ty và thông tin liên hệ                            | User Service                                    |
| F04 | Đăng, sửa, xóa và đóng/mở tin thuộc sở hữu                    | Job Service                                     |
| F05 | Tìm kiếm từ khóa, địa điểm, kỹ năng, khoảng lương, phân trang | Job Service                                     |
| F06 | Ứng tuyển vào tin tồn tại và còn mở                           | Application Service + Job Service               |
| F07 | Chặn ứng tuyển trùng kể cả gửi đồng thời                      | Unique compound index trong Application Service |
| F08 | Xem đơn bản thân, xem ứng viên theo quyền sở hữu tin          | Application Service                             |
| F09 | Đổi trạng thái pending/reviewing/accepted/rejected            | Application Service                             |
| F10 | Chấm điểm 0–100 và sắp xếp công việc theo hồ sơ               | Recommendation Service + User/Job Service       |
| F11 | Hiển thị lý do và từng thành phần điểm                        | API recommendation, frontend                    |
| F12 | Gateway tiếp nhận frontend, chặn endpoint nội bộ              | API Gateway                                     |
| F13 | Giao diện tiếng Việt và đầy đủ 11 nhóm trang yêu cầu          | React frontend                                  |

## Yêu cầu phi chức năng

- **Tách biệt dịch vụ:** mỗi backend có package/workspace, entry point và port riêng; User/Job/Application sở hữu database logic riêng.
- **Hợp đồng rõ ràng:** REST/JSON, HTTP status, Bearer JWT và header xác thực nội bộ được mô tả tại [API contract](03-api.md).
- **Bảo mật:** bcrypt cost 12, JWT HS256 có issuer/audience/expiry, whitelist trường cập nhật, validate bằng Zod, kiểm tra role/ownership ở service, rate limit cho đăng nhập/đăng ký và gateway, Helmet, CORS allowlist.
- **Khả năng chịu lỗi:** timeout HTTP nội bộ mặc định 5 giây; gateway mặc định 10 giây; lỗi dependency trả JSON `503`, gateway timeout trả `504`; lỗi không làm dừng tiến trình.
- **Dữ liệu bền vững:** MongoDB và unique indexes. Seed giữ nguyên dữ liệu đã tồn tại.
- **Khả năng bảo trì:** ES modules nhất quán; controller mỏng; nghiệp vụ tách riêng; clients HTTP không import model ngoài service.
- **Khả năng sử dụng:** responsive, focus keyboard, label cho input, loading, rỗng, lỗi có retry, toast; không yêu cầu thanh toán.
- **Khả năng kiểm chứng:** unit/integration và UI test trên database test riêng, kiểm tra build production và health.

## Phạm vi giao diện

1. Trang chủ: hero, tìm kiếm, job mới, giới thiệu gợi ý, footer.
2. Đăng nhập và đăng ký hai vai trò.
3. Danh sách việc làm với bộ lọc và phân trang.
4. Chi tiết công việc và gửi lời giới thiệu ứng tuyển.
5. Hồ sơ ứng viên/nhà tuyển dụng.
6. Công việc phù hợp với điểm số và lý do.
7. Lịch sử đã ứng tuyển, trạng thái xét duyệt.
8. Dashboard nhà tuyển dụng.
9. Tạo và sửa tin tuyển dụng.
10. Quản lý ứng viên theo tin và đổi trạng thái hồ sơ.

Đăng nhập và đăng ký là hai trang riêng, tương ứng tổng số nhóm trang tối thiểu của đề bài.
