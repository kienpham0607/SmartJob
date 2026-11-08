# 6. Quyết định thiết kế và giới hạn

## Vì sao kiến trúc này phù hợp đồ án

- Npm workspaces gom lệnh cài đặt, giữ mỗi service là ứng dụng riêng.
- Express + JavaScript ES modules dễ đọc với kiến thức Node cơ bản; controller tách khỏi nghiệp vụ.
- MongoDB database-per-service ở mức logic minh họa quyền sở hữu dữ liệu mà không cần ba cụm MongoDB.
- HTTP REST/JSON cho phép quan sát request, mô phỏng dependency lỗi và thay thế service theo contract.
- Service token bảo vệ endpoint nội bộ; JWT dùng riêng cho danh tính người dùng.
- Recommendation theo luật có công thức và test để trình bày, không phụ thuộc chi phí/token của AI API.
- Snapshot ứng tuyển giữ lại thông tin lúc gửi đơn thay vì làm hồ sơ lịch sử thay đổi khi ứng viên sửa profile.

## Nhất quán và vòng đời dữ liệu

Unique index `(jobId,candidateId)` được MongoDB đảm bảo nguyên tử trong Application database. Kiểm tra “job đang mở” là HTTP request trước khi insert; job có thể được đóng trong khoảng giữa hai bước. Không có distributed transaction giữa Job và Application. Với bài toán này, trạng thái job được xét tại thời điểm kiểm tra; đây là giới hạn TOCTOU cần nêu khi bảo vệ. Nếu cần cam kết mạnh hơn, dùng quy trình đặt chỗ/commit hoặc event-driven saga, kèm xử lý idempotency và bù trừ.

Xóa job không xóa cascade các đơn. Ứng viên còn xem snapshot, nhưng recruiter không còn xác minh được owner qua Job Service nên không quản lý đơn của job đã xóa. UI cảnh báo rõ trước khi xóa; đóng tin là thao tác phù hợp để kết thúc tuyển dụng và giữ xét duyệt.

Snapshot ứng viên được lưu một lần lúc ứng tuyển. Recruiter không tự thấy sửa đổi hồ sơ về sau; điều này giúp việc xét duyệt dựa trên hồ sơ đã nộp có tính ổn định. Bản đầu không có rút đơn, nộp lại hoặc upload CV PDF; các tính năng này không nằm trong yêu cầu bắt buộc.

## Bảo mật và môi trường local

- JWT HS256 dùng secret chung của trust domain, có issuer/audience/expiry. Khi triển khai nhiều đội độc lập có thể chuyển sang chữ ký bất đối xứng và JWKS.
- Đăng xuất xóa token phía client; JWT đã phát hành vẫn có hiệu lực đến expiry. Chưa có refresh token, blacklist, xác minh email hoặc quên mật khẩu.
- Token người dùng nằm trong sessionStorage để đóng phiên khi tab kết thúc; XSS vẫn có thể đọc token nếu xảy ra. React escape nội dung text, không dùng dangerouslySetInnerHTML cho mô tả job.
- Một service token chung cho internal calls, không phải phân quyền riêng theo từng caller. Production nên dùng khóa riêng, rotation, mTLS hoặc service identity.
- Các tiến trình bind `127.0.0.1`; CORS là allowlist origin, không thay thế authentication. Không expose MongoDB hoặc internal routes ra Internet khi triển khai.
- Ba service dữ liệu dùng chung URI MongoDB trong bản local, chưa có credential database tách biệt. Mỗi source chỉ dùng model của mình; DB permission ở mức hạ tầng có thể bổ sung sau.
- Rate limit dùng memory store của từng tiến trình; chưa chia sẻ qua Redis. Không cấu hình trust proxy tùy ý.
- Body tối đa 100 KB; input có validate và whitelist, ownership/JWT/role ở backend, password hash không trả ra API. Không log mật khẩu, JWT hay service token.

## Tìm kiếm và recommendation

- Tìm kiếm job dùng regex đã escape, không bỏ dấu và chưa dùng search index chuyên dụng. Thích hợp bộ dữ liệu đồ án, không phải benchmark hàng triệu tin.
- Recommendation đọc toàn bộ job mở theo từng trang và sắp xếp trong bộ nhớ; chi phí tăng theo dữ liệu, chưa cache. Khi tập dữ liệu thay đổi giữa các lần lấy trang, kết quả không phải snapshot nguyên tử của toàn danh sách.
- Skills cần cùng tên sau chuẩn hóa; chưa có từ điển alias như JS ↔ JavaScript hoặc Node ↔ Node.js.
- Location khớp chính xác sau chuẩn hóa; chưa đồng nhất HCM ↔ TP. Hồ Chí Minh, chưa tự tính khoảng cách.
- Position dùng token overlap, có thể đánh giá cao các từ chung như “developer”; trọng số do đề bài quy định và chưa được xác thực bằng phản hồi người dùng.
- Điểm là mức tương thích theo luật, không phải xác suất được tuyển hoặc đánh giá năng lực tuyệt đối.

## Vận hành

`/health` của service dữ liệu kiểm tra kết nối Mongoose. Health của gateway/recommendation chỉ kiểm tra chính tiến trình; `npm run health` kiểm tra từng backend riêng. HTTP nội bộ có timeout và lỗi `503`; gateway có timeout dài hơn mặc định, trả `504` khi hết hạn.

Chưa có service discovery, distributed tracing, circuit breaker, message broker, retry tự động hoặc tự khởi động lại tiến trình sau khi crash. Tránh retry POST ứng tuyển âm thầm để không làm người dùng hiểu sai kết quả; unique index bảo vệ trường hợp gửi lặp.

Build production frontend đã kiểm tra, nhưng hosting/TLS, reverse proxy, database backup, log aggregation, hiệu năng và bảo mật triển khai thật cần được thiết kế khi đưa hệ thống ra ngoài máy local. Các giới hạn trên không được biểu diễn thành chức năng đã hoàn thành.
