# 5. Kịch bản demo và kiểm thử

## Chuẩn bị trước buổi bảo vệ

1. Kiểm tra Node/npm, khởi động MongoDB và chạy `npm run check:db`.
2. Chạy `npm run setup` nếu chưa có `.env`, kiểm tra `npm run check:env`, sau đó `npm run seed`.
3. Đọc hai email demo và `DEMO_PASSWORD` trong `.env`; không chiếu các secret JWT/service token lên màn hình.
4. Chạy `npm run dev`, chờ cả frontend, gateway và bốn service sẵn sàng.
5. Chạy `npm run health` và `npm run smoke` tại terminal khác; cả năm backend cần `OK`, smoke cần PASS. Smoke dùng tài khoản demo và không sửa dữ liệu.
6. Mở `http://localhost:5173`, chuẩn bị hai cửa sổ trình duyệt khác nhau cho hai vai trò. Vì token ở sessionStorage, hai cửa sổ độc lập hoặc một cửa sổ ẩn danh giúp giữ hai phiên tách biệt.

## Kịch bản demo khoảng 10–15 phút

### Phần 1 — Kiến trúc

Mở sơ đồ [kiến trúc SOA](02-kien-truc-soa.md), chỉ rõ frontend → gateway → các service. Mở MongoDB Compass để thấy ba database logic và terminal để thấy các port khác nhau. Giải thích shared package chỉ chứa hạ tầng, không gộp service thành một server.

### Phần 2 — Ứng viên

1. Đăng nhập bằng tài khoản candidate được seed.
2. Mở Hồ sơ; kiểm tra skills React/JavaScript/Node.js/MongoDB/Git, vị trí Frontend Developer, kinh nghiệm 2 năm, Hà Nội. Có thể chỉnh một yếu tố rồi lưu.
3. Mở Gợi ý cho bạn; tin Frontend Developer (React) có thể đạt 100% khi hồ sơ khớp đủ. Chỉ ra từng lý do và trọng số 40/25/20/15.
4. Đổi địa điểm sang Đà Nẵng, lưu, tải lại gợi ý; job Hà Nội mất 15 điểm địa điểm nếu các yếu tố còn lại giữ nguyên. Khôi phục địa điểm nếu muốn tiếp tục theo bộ demo ban đầu.
5. Mở Tìm việc, thử q=Frontend, kỹ năng react, lương từ 20 triệu. Giải thích lọc theo khoảng lương giao nhau.
6. Mở chi tiết, nhập lời giới thiệu, ứng tuyển. Xem Lịch sử ứng tuyển ở trạng thái Đã gửi hồ sơ.
7. Thử nộp lại cùng job; backend trả 409 và UI thông báo đã ứng tuyển.

### Phần 3 — Nhà tuyển dụng

1. Tại cửa sổ khác đăng nhập recruiter demo.
2. Mở Dashboard, đăng một tin mới hoặc chọn tin ứng viên vừa nộp.
3. Xem hồ sơ ứng tuyển: email/kỹ năng/kinh nghiệm là snapshot tại thời điểm gửi; không thấy password hash.
4. Chọn Đang xem xét hoặc Được chấp nhận; quay lại cửa sổ candidate, tải lại trang để thấy thay đổi.
5. Sửa nội dung tin, đóng tin; tin bị loại khỏi tìm kiếm và recommendation. Chi tiết vẫn cho biết tin đã đóng.
6. Mở lại tin. Khi demo xóa, dùng tin mới tạo, vì xóa tin khiến recruiter không còn quản lý các đơn gắn với tin đó. Dùng đóng tin để lưu lịch sử xét duyệt.

### Phần 4 — Chứng minh giao tiếp và lỗi phụ thuộc

Mở Chrome DevTools → Network để thấy browser chỉ gọi gateway cổng 3000. Mở các file `clients/*Client.js` của Application và Recommendation để chỉ ra HTTP call đến cổng 3001/3002 với timeout và service token. Dùng Postman gọi trực tiếp `/internal/jobs` không kèm token để nhận 401; qua gateway nhận 404.

Không dừng tiến trình tùy ý của máy khi trình bày. Chạy `npm test` để chứng minh có kịch bản tự khởi động stack test ở cổng ngẫu nhiên, dừng Job Service của chính bộ test và kiểm tra 503/timeout. Đây là cách tái hiện lỗi dependency mà không ảnh hưởng stack demo đang chạy.

## Bộ kiểm thử tự động

### `npm test`

Node test runner thực hiện unit scoring và integration trên năm tiến trình riêng. Integration không dùng Supertest/in-process app; request thực sự đi qua TCP/HTTP và MongoDB. Database test có tiền tố `smartjob_test_<runId>_*`; chỉ ba database ngẫu nhiên của lần test đó được xóa trong teardown.

| Nhóm            | Điều kiện                                           | Kết quả kỳ vọng                         |
| --------------- | --------------------------------------------------- | --------------------------------------- |
| Đăng ký         | Hai role và email hợp lệ                            | 201, JWT, không có passwordHash         |
| Email           | Email khác hoa/thường đã tồn tại                    | 409                                     |
| Đăng nhập       | Đúng/sai mật khẩu                                   | 200 / 401                               |
| Input           | Email/role/ID/phân trang/lương sai                  | 400                                     |
| JWT             | Thiếu hoặc giả mạo token                            | 401                                     |
| Role            | Candidate đăng tin, recruiter xin gợi ý             | 403                                     |
| Profile         | Gửi role để nâng quyền                              | 400, role không đổi                     |
| CRUD            | Tạo, đọc, sửa, xóa job                              | 201/200/200/204; đọc job đã xóa 404     |
| Ownership       | Recruiter khác sửa/xóa tin                          | 403                                     |
| Giả danh        | Gửi recruiterId/candidateId trong body              | 400                                     |
| Tìm kiếm        | q + location + skill + salary + page                | Đúng tập kết quả và pagination          |
| Recommendation  | Profile/job khớp đủ                                 | 100 và có reasons từ dữ liệu thật       |
| Tin đóng        | Tìm kiếm/gợi ý/ứng tuyển                            | Bị loại khỏi danh sách; ứng tuyển 409   |
| Race duplicate  | Hai lần nộp cùng job đồng thời                      | Một 201, một 409 nhờ unique index       |
| Riêng tư        | Candidate khác xem lịch sử bản thân                 | Không thấy đơn của người khác           |
| Hồ sơ ứng viên  | Candidate/recruiter không sở hữu gọi list/status    | 403                                     |
| Cập nhật status | Chủ tin gửi reviewing                               | 200 và dữ liệu đổi                      |
| Internal        | Thiếu service token / token đúng                    | 401 / 200; không có hash                |
| Gateway         | Gọi /internal hoặc internal trong public path       | 404                                     |
| CORS            | Origin trong/ngoài allowlist                        | Có/không có allow-origin tương ứng      |
| HTTP input      | JSON lỗi/body >100 KB                               | 400 / 413                               |
| Dependency      | Dừng Job hoặc User Service trong stack test         | 503, tiến trình khác vẫn phản hồi       |
| Timeout         | HTTP endpoint test nhận kết nối nhưng không trả lời | Gateway 504; nội bộ trả lỗi rõ ràng     |
| Chuẩn hóa       | Tiếng Việt/hoa thường/khoảng trắng                  | So sánh ổn định                         |
| Scoring         | Khớp đủ/khớp phần/thiếu/null/NaN/trùng              | Đúng trọng số, luôn hữu hạn trong 0–100 |

Server HTTP không phản hồi chỉ được tạo trong test timeout. Luồng sản phẩm không dùng server giả hoặc dữ liệu dự phòng.

### `npm run test:ui`

Playwright tự khởi động gateway + bốn service và Vite ở cổng ngẫu nhiên, dùng ba database `smartjob_test_ui_<runId>_*`, rồi xóa đúng ba database đó sau kiểm thử. Không thay đổi các tài khoản demo hoặc database sản phẩm. Ba kịch bản kiểm tra bao phủ:

1. Toàn bộ hành trình qua giao diện: đăng ký recruiter → đăng job → đăng ký candidate → cập nhật profile → gợi ý 100% và reasons → ứng tuyển → nộp trùng → xem lịch sử → recruiter xem hồ sơ → đổi status → candidate thấy status mới → sửa/đóng/mở job → tìm kiếm/lọc → chặn sai role → đăng xuất/đăng nhập → xóa job.
2. Responsive 360/390/768/1440 px, không tràn ngang, menu mobile, tìm kiếm với empty state, từ chối khoảng lương đảo ngược và trang 404.
3. Khôi phục phiên: ngắt request tải profile để tái hiện lỗi transport, xác minh JWT được giữ, thử lại gọi API thật và đọc được hồ sơ, sau đó xác minh JWT sai bị backend từ chối bằng 401 và xóa khỏi client. Chỉ tạo lỗi đường truyền trong test, không dựng response/data giả cho sản phẩm.

Browser errors được theo dõi trong test hành trình. Khi lỗi, screenshot và trace nằm trong `.local/ui-results`; thư mục này không được commit. Mặc định dùng Chrome đã cài; `BROWSER_CHANNEL=msedge` chọn Edge.

## Bằng chứng và giới hạn xác minh

Kết quả cuối cùng của phiên triển khai được ghi trong [PROGRESS.md](../PROGRESS.md), tránh báo cáo kết quả cũ sau khi thay đổi source. Đã kiểm tra thực tế bằng Node.js 24.12.0, MongoDB local và Chrome có sẵn. Backend được kiểm tra qua cả test tự khởi động và lệnh dev ở các cổng 3000–3004; frontend đã được chụp desktop/mobile và quan sát dữ liệu thật sau khi sửa CORS.

Các cách khởi động MongoDB bằng Docker và `npm run db:demo` là phương án cài đặt bổ sung, không được khẳng định đã chạy thử nếu máy đang dùng MongoDB có sẵn. Không có triển khai production hoặc benchmark tải lớn trong phạm vi phiên này.
