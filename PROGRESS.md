# Tiến độ SmartJob

Ngày bắt đầu: 03/11/2026. Triển khai trực tiếp tại D:\LTW\SmartJob (thư mục ban đầu trống).

1. **Đã kiểm tra:** cấu trúc npm workspaces, cấu hình môi trường, thư viện chung, MongoDB ping OK. Cài 266 packages, npm audit báo 0 lỗ hổng tại thời điểm cài.
2. **Đã kiểm tra:** User Service, đăng ký/đăng nhập, JWT, hồ sơ, phân quyền, khóa nội bộ.
3. **Đã kiểm tra:** Job Service, CRUD, lọc, phân trang, quyền sở hữu, đóng/mở tin.
4. **Đã kiểm tra:** Application Service gọi HTTP thật; snapshot hồ sơ; unique index chặn trùng khi gửi đồng thời; quyền xem/cập nhật.
5. **Đã kiểm tra:** Recommendation Service gọi HTTP thật, phân trang nguồn, thuật toán 40/25/20/15. Bốn unit test thuật toán đạt.
6. **Đã build:** API Gateway và 11 trang frontend React/Vite/JSX, Tailwind, React Router, Axios, Lucide. UI tiếng Việt, responsive, phân quyền, loading/empty/error/toast. Chia trang bằng lazy import để giảm tải ban đầu.
7. **Đã seed:** 2 tài khoản demo, 9 tin tuyển dụng trong MongoDB thật. Chạy seed lần hai không tạo trùng, không sửa tài khoản hay tin có sẵn.
8. **Đã kiểm tra lại 04/11/2026:** 20/20 test backend (3 cấu hình + 13 integration + 4 unit scoring), 3/3 kịch bản UI trên Chrome; build production thành công; health 5/5 và smoke trên API local thật đạt. Hoàn tất README và 6 tài liệu SOA/API/demo/giới hạn bằng tiếng Việt.

## Tiếp tục hoàn thiện ngày 04/11/2026

### Khảo sát trạng thái và phạm vi

- Đã đọc lại README, PROGRESS, cấu trúc routes/controllers/services/models/clients, npm workspaces và .env.example. Không phát hiện AGENTS.md áp dụng thêm.
- Năm luồng ưu tiên đã có đầy đủ: đăng ký/đăng nhập, đăng/quản lý tin, tìm kiếm, gợi ý, ứng tuyển/xét duyệt. Không viết lại nghiệp vụ đang hoạt động.
- `npm ls --depth=0`: dependencies và workspace links hợp lệ; không cần cài lại hay đổi phiên bản package. Node 24.12.0, npm 11.6.2.
- MongoDB có sẵn kết nối thành công. Ban đầu health cả năm service thất bại vì stack đã được dừng ở phiên trước; sau khi chạy dev cả năm đều 200. Không che lỗi bằng dữ liệu giả.

### Lỗi tái hiện và sửa

1. **Khoảng lương đảo ngược:** test mới thất bại `200 !== 400` trên API thật. Nguyên nhân searchSchema chỉ kiểm tra từng số, không kiểm tra quan hệ hai cận. Bổ sung refine `salaryMax >= salaryMin` khi có cả hai; API trả 400 VALIDATION_ERROR, UI hiển thị lý do và người dùng sửa được bộ lọc.
2. **Mất phiên khi API tạm lỗi:** test trình duyệt mới ngắt request profile, tái hiện việc client chuyển login và xóa JWT. Nguyên nhân AuthProvider gọi logout trong catch cho mọi lỗi. Đã phân biệt 401 với lỗi transport/timeout/5xx, giữ JWT, hiển thị error state trên trang bảo vệ và cho retry bằng API thật. Test xác nhận retry phục hồi hồ sơ, JWT sai vẫn bị backend trả 401 và xóa khỏi client.
3. **Cấu hình thiếu kiểm tra sớm:** bổ sung schema môi trường cho secret, JWT TTL, URI, origin/URL, port, timeout, tên database và điều kiện không trùng. Lỗi nêu tên biến, không in giá trị bí mật. Thêm ba test cấu hình. `predev` kiểm tra env và MongoDB trước khi mở stack.

### Công cụ và tài liệu bổ sung

- `npm.cmd run check:env`: đối chiếu .env.example với môi trường hiện tại, kiểm tra cấu hình. .env cũ thiếu GATEWAY_TIMEOUT_MS được dùng default 10000 ms; đây là INFO, không cần sửa thủ công.
- `npm.cmd run smoke`: kiểm tra read-only trên stack và tài khoản demo thật, gồm HTML frontend, login cả hai role, tìm kiếm, profile, recommendation, lịch sử ứng tuyển và quyền recruiter gọi Application → Job. Xác minh CORS và gateway chặn internal. Không tạo/sửa/xóa dữ liệu demo.
- `health` hiển thị URL và mã lỗi kết nối để phân biệt service dừng, MongoDB lỗi và cấu hình sai.
- Cập nhật README với lệnh PowerShell, hai terminal, biến cần sửa khi chuyển máy và cách kiểm tra sau startup; bổ sung API contract và kịch bản demo/test.

### Kết quả kiểm chứng

| Kiểm tra                           | Kết quả 04/11/2026                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Baseline trước sửa                 | Build đạt, 16/16 backend và 2/2 UI cũ đạt                                                  |
| Test hồi quy trước sửa             | Test salary và khôi phục phiên thất bại đúng lỗi đã xác định                               |
| `npm.cmd test` sau sửa             | 20/20 đạt, exit 0                                                                          |
| `npm.cmd run test:ui` sau sửa      | 3/3 đạt, exit 0; toàn bộ hành trình tuyển dụng, lỗi mạng/401, responsive và invalid salary |
| `npm.cmd run build`                | Thành công; entry JS khoảng 238,57 KB trước gzip                                           |
| `npm.cmd run dev` sau thêm predev  | Check env + MongoDB OK, sáu tiến trình khởi động trên cổng yêu cầu                         |
| `npm.cmd run health`               | 5/5 service OK sau khi stack ổn định                                                       |
| `npm.cmd run smoke`                | PASS; 2 tin khớp Frontend, 9 job recommendation; login hai demo thành công                 |
| `node scripts/capture-ui.js`       | Desktop/mobile hiển thị job từ API thật, không có lỗi JS runtime                           |
| Prettier / git diff check / ignore | Đạt; secrets, node_modules, build và .local không được Git theo dõi                        |

Một health check diễn ra đúng lúc Node --watch đang restart sau định dạng source đã báo fetch failed. Đã đọc log restart và chạy lại sau khi tiến trình sẵn sàng: tất cả OK. Không coi kết quả tạm thời này là bằng chứng API đã hoạt động trước khi kiểm tra lại.

### Tình trạng service đã xác minh

| Thành phần             | Port | Kết quả                                                                       |
| ---------------------- | ---- | ----------------------------------------------------------------------------- |
| Frontend React/Vite    | 5173 | HTTP 200, gọi Gateway thành công trong browser                                |
| API Gateway            | 3000 | Health 200; chuyển tiếp auth/jobs/applications/recommendations, chặn internal |
| User Service           | 3001 | Health 200; MongoDB users kết nối, hai demo login thành công                  |
| Job Service            | 3002 | Health 200; tìm kiếm/CRUD/ownership và validate salary đạt                    |
| Application Service    | 3003 | Health 200; HTTP Job + User, duplicate và xét duyệt đạt                       |
| Recommendation Service | 3004 | Health 200; HTTP User + Job, điểm/lý do/phân trang đạt                        |

Các test dùng database ngẫu nhiên riêng và tự dọn; kiểm tra cuối không còn database smartjob_test_*. Dữ liệu/tài khoản demo được giữ nguyên; không chạy seed để ghi đè dữ liệu có sẵn. Đã dừng các tiến trình dev do phiên này mở sau kiểm tra, xác nhận không còn Node chạy nền; chạy `npm.cmd run dev` để sử dụng. MongoDB của người dùng vẫn hoạt động, kiểm tra ping cuối OK.

### Những việc còn cần người dùng cấu hình

- **Trên máy hiện tại:** không thiếu biến bắt buộc hoặc dependency cho luồng local; cần giữ MongoDB hoạt động và giữ terminal dev mở khi dùng ứng dụng. Mật khẩu demo xem DEMO_PASSWORD trong .env.
- **Khi chuyển máy/cổng:** cài dependency bằng npm ci, tạo .env bằng setup nếu chưa có; cấu hình MONGODB_URI và đồng bộ port/URL/origin theo README. Cần Chrome/Edge nếu muốn chạy UI test.
- Không có chức năng bắt buộc nào của năm luồng ưu tiên còn bị bỏ trống trong phạm vi đã kiểm chứng. Docker/db:demo, triển khai production, tải lớn và các giới hạn thiết kế ở docs/06 chưa được mở rộng trong lần tiếp tục này; không khẳng định đã kiểm thử các môi trường đó.

## Khảo sát

- Node.js v24.12.0, npm 11.6.2; PowerShell chặn npm.ps1 nên dùng npm.cmd trên terminal Windows.
- MongoDB 27017 đã xác minh bằng Mongoose: ping OK.
- Đã tham khảo README, backend README, frontend README của https://github.com/hungnm1911/JOBHUB. Chỉ tham khảo phân chia nghiệp vụ và REST; không sao chép mã.
- Không có AGENTS.md trong workspace hoặc các thư mục cha đã kiểm tra.
- Mọi thao tác nằm trong SmartJob; Git ở thư mục cha chứa các dự án khác và không được chỉnh sửa.

## Bằng chứng kiểm tra giai đoạn 1–5

- `node --check` các file JS backend đã tạo: đạt.
- `node scripts/db-check.js`: MongoDB ping OK.
- `node --test tests/scoring.test.js`: 4/4 đạt.
- Lần chạy integration đầu phát hiện lỗi teardown khi dừng lại tiến trình đã bị kill. Đã sửa signalCode và Map tiến trình. Các lần chạy sau kết thúc sạch, tự xóa đúng database test của lần chạy.
- npm trong sandbox lỗi EACCES với registry; đã chạy lại sau khi được cấp quyền tải dependencies.
- Build frontend lần đầu phát hiện lỗi thẻ option trên trang chủ; đã sửa. Đã chia bundle theo trang và ép production mode khi build để không nhận NODE_ENV=development từ .env backend; build cuối không còn cảnh báo chunk lớn.

## Xác minh cuối ngày 03/11/2026

| Lệnh / kiểm tra              | Kết quả thực tế                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm test`                   | 16/16 đạt, exit 0; khoảng 11 giây                                                                  |
| `npm run test:ui`            | 2/2 đạt trên Chrome, exit 0; khoảng 19 giây                                                        |
| `npm run build`              | Thành công, frontend/dist, exit 0; entry JS khoảng 238 KB trước gzip, chia riêng thư viện và trang |
| `npm run dev`                | Frontend :5173, gateway :3000 và 4 service :3001–3004 khởi động thật                               |
| `npm run health`             | Gateway/User/Job/Application/Recommendation đều OK                                                 |
| `npm run seed` hai lần       | Lần đầu tạo 2 tài khoản + 9 jobs; lần hai giữ nguyên, không tạo trùng                              |
| `node scripts/capture-ui.js` | Chụp desktop/mobile, dữ liệu job thật hiển thị, không có JS runtime error                          |
| Kiểm tra responsive          | 360, 390, 768, 1440 px, không tràn ngang                                                           |
| Kiểm tra Git ignore          | .env, .local, frontend/dist và node_modules đều được ignore                                        |

### Lỗi đã phát hiện và sửa

- CORS khi truy cập frontend bằng 127.0.0.1 trong khi allowlist chỉ có localhost: đã hỗ trợ danh sách origin rõ ràng và cấu hình cả hai địa chỉ local. Đã xác nhận job API hiển thị trong Chrome sau sửa.
- Selector test responsive khớp hai heading: đã giới hạn heading cấp 1; chạy lại đạt. Không phải lỗi chức năng UI.
- Backend xử lý JSON lỗi 400, payload lớn 413, duplicate email/application riêng; test timeout dùng server HTTP không phản hồi chỉ trong bộ test.
- JWT hết hạn bị từ chối; recommendation xét đủ 52 job trong test để xác minh đi qua hơn một trang nguồn và xếp hạng toàn bộ.

### Bàn giao

- Source và tài liệu được tạo trực tiếp tại workspace, chưa commit/push/deploy.
- MongoDB local có sẵn đã dùng cho kiểm thử; không dừng MongoDB của người dùng.
- .env đã được tạo bằng setup với secret và mật khẩu ngẫu nhiên; không in secret trong log. Xem DEMO_PASSWORD trong .env để dùng tài khoản demo.
- Các database test của các lần chạy hoàn tất được tự động dọn; không dùng database demo để chạy UI test. Đã xác định đúng run ID của lần test đầu bị kẹt teardown, kiểm tra fixture trước khi dọn ba database sót của lần đó.
- Đã dừng stack dev do phiên này khởi động sau khi kiểm tra; không còn tiến trình Node của phiên chạy nền. MongoDB có sẵn được giữ hoạt động.
- `npm exec prettier -- --check .`: đạt sau định dạng toàn bộ source/tài liệu.
- Chưa kiểm thử hai phương án MongoDB bổ sung (Docker Compose và db:demo), chưa triển khai production hoặc benchmark tải lớn. Các giới hạn nhất quán liên service, xóa job, JWT logout và thuật toán được ghi trong docs/06-quyet-dinh-gioi-han.md.
- Chạy lại local: `npm.cmd run dev`, mở http://localhost:5173. Chi tiết tại README.md.
