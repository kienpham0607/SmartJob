# 3. Hợp đồng REST API và hướng dẫn Postman

## Quy ước

- Base URL public: `http://localhost:3000` (Gateway).
- Body JSON, header `Content-Type: application/json` cho POST/PUT/PATCH.
- Endpoint có bảo vệ yêu cầu `Authorization: Bearer <token>`; lấy token từ `data.token` của register/login.
- Thành công: `{ "data": ... }`. Xóa thành công: `204`, không body.
- Danh sách: `{ "data": { "items": [], "total": 0, "page": 1, "limit": 12, "totalPages": 0 } }`.
- `page`: số nguyên 1–10000, `limit`: số nguyên 1–50, mặc định `page=1&limit=12`. Application và recommendation cũng dùng quy ước này.
- ID là chuỗi 24 ký tự hexadecimal. JSON trả `_id` cho ID tài nguyên.
- Lương tính bằng VND/tháng, số năm kinh nghiệm là số không âm, tối đa 60. Ngày giờ dạng ISO 8601; UI định dạng ngày Việt Nam.
- JSON validation không cho trường ngoài contract ở register/login, profile, tạo/sửa job, tạo application và cập nhật status. Gửi `candidateId` hoặc `recruiterId` vào body không được chấp nhận.

Ví dụ lỗi:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ.",
    "details": [{ "field": "email", "message": "Invalid email address" }]
  }
}
```

`details` chỉ có với lỗi validate; một số thông báo kỹ thuật của thư viện validation dùng tiếng Anh. UI và thông báo nghiệp vụ dùng tiếng Việt. Không trả stack trace.

| Status | Ý nghĩa                                                         |
| ------ | --------------------------------------------------------------- |
| 200    | Đọc/sửa thành công                                              |
| 201    | Tạo tài khoản/job/application thành công                        |
| 204    | Xóa job thành công                                              |
| 400    | Input, ID hoặc JSON không hợp lệ                                |
| 401    | Thiếu/sai/hết hạn JWT; sai mật khẩu; sai khóa service           |
| 403    | Sai role hoặc không sở hữu tài nguyên                           |
| 404    | Không có route/tài nguyên; tài nguyên liên quan đã xóa          |
| 409    | Trùng email, trùng ứng tuyển hoặc tin đã đóng                   |
| 413    | Body vượt 100 KB                                                |
| 429    | Rate limit                                                      |
| 500    | Lỗi máy chủ không dự kiến, thông báo tổng quát                  |
| 503    | Service không sẵn sàng / dependency lỗi hoặc hết timeout nội bộ |
| 504    | Gateway chờ service quá thời hạn                                |

## User Service

### POST /api/auth/register — khách

```json
{
  "name": "Nguyễn An",
  "email": "an@example.com",
  "password": "MatKhauDemo42!",
  "role": "CANDIDATE"
}
```

`name`: 1–100 ký tự, `email`: chuẩn email, tối đa 254; email được trim/lowercase và có unique index. `password`: tối thiểu 8 ký tự, tối đa 72 byte UTF-8 (giới hạn bcrypt). `role`: `CANDIDATE` hoặc `RECRUITER`, mặc định candidate. Trả `201`:

```json
{
  "data": {
    "user": {
      "_id": "0123456789abcdef01234567",
      "name": "Nguyễn An",
      "email": "an@example.com",
      "role": "CANDIDATE",
      "skills": [],
      "experienceYears": 0,
      "desiredPosition": "",
      "location": "",
      "companyName": "",
      "phone": "",
      "bio": ""
    },
    "token": "<JWT>"
  }
}
```

User thực tế còn `createdAt`, `updatedAt`; không có `passwordHash`. ID trên chỉ minh họa định dạng, thay bằng ID API trả trong Postman.

### POST /api/auth/login — khách

Body `{ "email": "an@example.com", "password": "MatKhauDemo42!" }`. Trả `200` với cùng cấu trúc `{user,token}`. JWT chứa `sub` (user ID), `role`, `iat`, `exp`, issuer `smartjob-users`, audience `smartjob`. Thời hạn mặc định `8h`, cấu hình `JWT_EXPIRES_IN`. Sai thông tin trả `401 INVALID_CREDENTIALS`.

### GET /api/users/me — cả hai role

Trả `200 {data: user}` của JWT hiện tại.

### PUT /api/users/me — cả hai role

Cập nhật từng phần, không cần gửi lại mọi trường:

```json
{
  "name": "Nguyễn An",
  "skills": ["React", "Node.js", "MongoDB"],
  "experienceYears": 2,
  "desiredPosition": "Frontend Developer",
  "location": "Hà Nội",
  "phone": "0901234567",
  "bio": "Lập trình viên web yêu thích phát triển sản phẩm."
}
```

Ứng viên được cập nhật `name, skills, experienceYears, desiredPosition, location, phone, bio`. Recruiter được cập nhật `name, companyName, location, phone, bio`; các trường nghiệp vụ của vai trò khác bị bỏ qua. Không cho đổi email/role/password qua endpoint này.

Kỹ năng: tối đa 40 phần tử, mỗi phần tử 1–60 ký tự, trim/lowercase, loại trùng. Vị trí/địa điểm/tên công ty tối đa 150, phone tối đa 30, bio tối đa 3000. Trả hồ sơ sau cập nhật.

Đăng xuất thực hiện phía client bằng cách xóa token; không có endpoint logout và không thu hồi token đã phát hành trước thời hạn.

## Job Service

### GET /api/jobs — công khai

Chỉ liệt kê job `status=open`, mới nhất trước (`createdAt`, `_id` giảm dần).

Ví dụ: `/api/jobs?q=Frontend&location=H%C3%A0%20N%E1%BB%99i&skill=react&salaryMin=15000000&salaryMax=30000000&page=1&limit=9`

| Query       | Cách lọc                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------- |
| q           | Substring không phân biệt hoa/thường trong title, companyName hoặc description; regex được escape |
| location    | Substring không phân biệt hoa/thường trong location                                               |
| skill       | Một kỹ năng khớp toàn bộ tên, không phân biệt hoa/thường                                          |
| salaryMin   | `job.salaryMax >= salaryMin`                                                                      |
| salaryMax   | `job.salaryMin <= salaryMax`                                                                      |
| page, limit | Phân trang theo quy ước chung                                                                     |

Lọc lương chọn **khoảng lương giao nhau**. Khi cung cấp cả hai cận, `salaryMax` phải lớn hơn hoặc bằng `salaryMin`; khoảng đảo ngược trả `400 VALIDATION_ERROR`. Tìm kiếm API không tự bỏ dấu tiếng Việt; phần recommendation có chuẩn hóa dấu riêng.

### GET /api/jobs/my-jobs — RECRUITER

Lấy tin của JWT hiện tại (cả open và closed), có cùng query và phân trang. Route `my-jobs` được khai báo trước `:id` để không bị nhận nhầm là job ID.

### GET /api/jobs/:id — công khai

Trả `{data: job}` kể cả tin đã đóng để hiển thị chi tiết/trạng thái lịch sử. Job gồm các trường dưới, cùng `_id`, `recruiterId`, `createdAt`, `updatedAt`. Không tồn tại trả `404 JOB_NOT_FOUND`.

### POST /api/jobs — RECRUITER

```json
{
  "title": "Frontend Developer (React)",
  "description": "Phát triển giao diện web với React.\nPhối hợp với backend để tích hợp REST API.",
  "companyName": "NovaTech",
  "location": "Hà Nội",
  "salaryMin": 18000000,
  "salaryMax": 30000000,
  "requiredSkills": ["react", "javascript", "git"],
  "experienceMin": 2,
  "jobType": "FULL_TIME",
  "status": "open"
}
```

Trả `201 {data: job}`. `recruiterId` do backend gắn từ JWT, không nhận từ body. Title/companyName/location 1–150 ký tự; description 1–15000; lương 0–10 tỷ VND, `salaryMax >= salaryMin`. Required skills theo quy ước User. `jobType`: `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`; status `open`/`closed` (mặc định open).

### PUT /api/jobs/:id — RECRUITER sở hữu tin

**Gửi đầy đủ body giống POST**; không phải PATCH. Backend xác minh chủ sở hữu trước khi lưu. Đóng/mở tin bằng cách gửi toàn bộ job với status mới. Trả `200 {data: job}`; recruiter khác nhận `403 NOT_JOB_OWNER`.

### DELETE /api/jobs/:id — RECRUITER sở hữu tin

Trả `204`. Các đơn đã nộp vẫn giữ snapshot cho ứng viên xem lịch sử. Sau khi job bị xóa, recruiter không thể xác minh quyền sở hữu job qua Job Service nên không còn xem/đổi trạng thái đơn đó; nên **đóng tin** khi muốn giữ khả năng quản lý hồ sơ.

## Application Service

### POST /api/applications — CANDIDATE

```json
{
  "jobId": "<ID job thực tế>",
  "coverLetter": "Tôi có kinh nghiệm phát triển React và mong muốn ứng tuyển."
}
```

`coverLetter` tùy chọn, tối đa 5000 ký tự. Candidate ID lấy từ JWT, không từ client. Application gọi Job và User qua HTTP có service token. Job phải tồn tại, status open; User phải là candidate. Tạo snapshot công việc và hồ sơ tại lúc nộp. Trả `201`:

```json
{
  "data": {
    "_id": "<applicationId>",
    "jobId": "<jobId>",
    "candidateId": "<JWT sub>",
    "coverLetter": "...",
    "status": "pending",
    "jobSnapshot": {
      "title": "Frontend Developer",
      "companyName": "NovaTech",
      "location": "Hà Nội"
    },
    "candidateSnapshot": {
      "name": "Nguyễn An",
      "email": "an@example.com",
      "phone": "0901234567",
      "skills": ["react"],
      "experienceYears": 2,
      "desiredPosition": "Frontend Developer",
      "location": "Hà Nội",
      "bio": "..."
    },
    "createdAt": "<ISO date>",
    "updatedAt": "<ISO date>"
  }
}
```

Unique index `(jobId,candidateId)` chặn nộp trùng kể cả hai request cùng lúc. Tin đã đóng trả `409 JOB_CLOSED`; trùng trả `409 DUPLICATE`; service liên quan không hoạt động trả `503 DEPENDENCY_UNAVAILABLE`.

### GET /api/applications/me — CANDIDATE

Query `page,limit`; chỉ lấy đơn có `candidateId=JWT.sub`. Không có tham số để đọc đơn của người khác. Trả danh sách phân trang mới nhất trước.

### GET /api/applications/job/:jobId — RECRUITER sở hữu tin

Query `page,limit`. Gọi Job Service để lấy chủ tin và so sánh JWT.sub trước khi truy vấn hồ sơ. Trả danh sách phân trang gồm snapshot ứng viên và lời giới thiệu. Không sở hữu tin trả `403`.

### PATCH /api/applications/:id/status — RECRUITER sở hữu tin

Body `{ "status": "reviewing" }`. Các giá trị: `pending`, `reviewing`, `accepted`, `rejected`. Trả `200 {data: application}` sau cập nhật. Mọi lần đổi trạng thái đều xác minh job owner bằng HTTP. Bản đồ án cho phép recruiter chọn lại bất kỳ trạng thái hợp lệ; chưa áp dụng quy trình chuyển trạng thái một chiều.

## Recommendation Service

### GET /api/recommendations/me — CANDIDATE

Query `page,limit`. Lấy hồ sơ từ User Service và toàn bộ job mở từ Job Service theo từng trang, chấm điểm rồi sắp xếp giảm dần. Không nhận user ID từ query/body.

Mỗi item là job kèm:

```json
{
  "score": 100,
  "breakdown": { "skills": 40, "position": 25, "experience": 20, "location": 15 },
  "matchedSkills": ["react", "javascript", "git"],
  "reasons": [
    "Trùng 3/3 kỹ năng yêu cầu: react, javascript, git.",
    "Vị trí phù hợp 100% với mong muốn của bạn.",
    "Kinh nghiệm đáp ứng yêu cầu tuyển dụng.",
    "Cùng địa điểm làm việc mong muốn."
  ]
}
```

Envelope danh sách có thêm `weights: {skills:40,position:25,experience:20,location:15}`. `breakdown` là **điểm đóng góp**, không phải tỷ lệ từng yếu tố. Các thành phần được làm tròn riêng nên trong một số trường hợp tổng breakdown có thể lệch 1 điểm với score làm tròn từ tổng gốc. Chi tiết tại [thuật toán](04-recommendation.md).

## API nội bộ — gọi trực tiếp service, không qua Gateway

Tất cả yêu cầu header `x-service-token: <INTERNAL_SERVICE_TOKEN>`. Bearer JWT không thay thế khóa service. Token nội bộ lấy từ môi trường, không đưa vào code frontend hoặc biến `VITE_*`.

| Method / URL                                            | Output                                                   |
| ------------------------------------------------------- | -------------------------------------------------------- |
| GET http://localhost:3001/internal/users/:id            | `{data: user}`, không có passwordHash                    |
| GET http://localhost:3002/internal/jobs/:id             | `{data: job}` kể cả tin đóng, dùng kiểm tra owner/status |
| GET http://localhost:3002/internal/jobs?page=1&limit=50 | Job đang mở, envelope phân trang                         |

Thiếu/sai token trả `401 SERVICE_UNAUTHORIZED`; ID sai `400`; không tồn tại `404`. Gateway chỉ chuyển tiếp public namespaces đã cho phép và không chuyển header `x-service-token` từ client.

## Health

`GET /health` trên từng backend trả `{service,status}`; service có database còn trả tên database. User/Job/Application chỉ healthy khi Mongoose đang connected. Gateway và Recommendation kiểm tra tiến trình của chính mình; không giả định dependency đều đang tốt. Endpoint health không yêu cầu JWT.

## Thử bằng Postman

1. Tạo Environment với `baseUrl=http://localhost:3000`, `candidateToken`, `recruiterToken`, `jobId`, `applicationId`.
2. Gửi register/login candidate. Lưu `data.token` vào `candidateToken`.
3. Register/login recruiter, lưu token vào `recruiterToken`.
4. POST `{{baseUrl}}/api/jobs`, Authorization chọn Bearer `{{recruiterToken}}`; lưu `data._id` vào `jobId`.
5. PUT `/api/users/me` với candidate token và profile ở trên.
6. GET `/api/recommendations/me` với candidate token, kiểm tra score/reasons.
7. POST `/api/applications` với candidate token và `jobId`; lưu applicationId. Gửi lại phải nhận `409`.
8. GET `/api/applications/job/{{jobId}}`, sau đó PATCH `/api/applications/{{applicationId}}/status` với recruiter token.
9. GET `/api/applications/me` với candidate token để thấy status đổi.
10. Gọi endpoint nội bộ qua gateway phải `404`; gọi trực tiếp thiếu service token phải `401`.

Có thể thêm script Post-response của request login candidate:

```javascript
pm.test('Login thành công', () => pm.response.to.have.status(200));
pm.environment.set('candidateToken', pm.response.json().data.token);
```

Các mật khẩu trong ví dụ chỉ là dữ liệu nhập khi kiểm thử, không phải mật khẩu demo đã được tạo trên máy.
