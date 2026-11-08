# 4. Thuật toán gợi ý việc làm

## Mục tiêu và dữ liệu

Thuật toán đo mức độ tương thích giữa hồ sơ candidate và một tin tuyển dụng đang mở. Mã chính ở `services/recommendation-service/src/services/scoring.js`; workflow tại `recommendationService.js`.

Mỗi request `/api/recommendations/me`:

1. Xác minh JWT, bắt buộc role CANDIDATE.
2. Gọi HTTP User Service bằng JWT.sub để lấy hồ sơ.
3. Đồng thời lấy tất cả job mở từ Job Service qua endpoint nội bộ phân trang 50 phần tử; không chỉ lấy trang đầu.
4. Chuẩn hóa, chấm điểm từng job, sắp xếp giảm dần. Khi cùng điểm, dùng `_id` để thứ tự ổn định.
5. Phân trang danh sách đã sắp xếp, trả score, breakdown, matchedSkills, reasons và weights.

Không truy cập database của service khác, không dùng job/profile hardcode trong Recommendation, không gọi dịch vụ AI trả phí. Từ “thông minh” trong sản phẩm mô tả gợi ý cá nhân hóa theo luật; không đồng nghĩa với mô hình học máy.

## Chuẩn hóa

`normalize` áp dụng Unicode NFD, bỏ combining marks, đổi `đ/Đ` thành `d/D`, lowercase, gộp khoảng trắng, trim. Giá trị không phải chuỗi thành chuỗi rỗng. Ví dụ `"  ĐÀ   NẴNG " → "da nang"` và `" React " → "react"`.

Kỹ năng được so sánh theo tên đã chuẩn hóa, loại trùng. Không dùng substring cho kỹ năng: `java` không khớp với `javascript`. Tên vị trí được tách thành tập token chữ/số, giữ ký hiệu `+`, `#`, `.` cho các tên công nghệ. Location cần bằng nhau sau chuẩn hóa; bản này chưa có danh mục alias địa điểm.

## Công thức

Đặt S, P, E, L thuộc `[0,1]`:

```text
MatchScore = round(40 × S + 25 × P + 20 × E + 15 × L)
MatchScore được chặn trong [0,100].
```

### SkillsMatch — 40 điểm

```text
S = số kỹ năng yêu cầu mà ứng viên có / tổng số kỹ năng yêu cầu khác nhau
```

Không có danh sách kỹ năng yêu cầu thì S=0: không tự trao điểm vì thiếu bằng chứng. Kỹ năng dư của ứng viên không làm giảm điểm. Không có kỹ năng ứng viên thì S=0.

### PositionMatch — 25 điểm

```text
P = số token vị trí mong muốn xuất hiện trong title job / số token vị trí mong muốn
```

Ví dụ desiredPosition=`Frontend Developer`, title=`Senior Frontend Developer (React)` thì P=1. Title=`Backend Developer` thì P=0,5 (chỉ khớp “developer”). Vị trí mong muốn rỗng thì P=0.

### ExperienceMatch — 20 điểm

Nếu cả số năm của ứng viên và yêu cầu là số hữu hạn không âm:

```text
Nếu experienceMin = 0: E = 1
Nếu experienceMin > 0: E = min(experienceYears / experienceMin, 1)
```

Thiếu hoặc sai kiểu, âm hay NaN thì E=0. User mới có `experienceYears=0` theo model: đó là kinh nghiệm mặc định 0 năm. Công việc ghi rõ không cần kinh nghiệm (0) được đủ 20 điểm thành phần này, dù ứng viên mới.

### LocationMatch — 15 điểm

Hai địa điểm không rỗng và bằng nhau sau chuẩn hóa thì L=1, còn lại 0. Remote không tự động khớp mọi địa điểm; hồ sơ cần ghi Remote để được điểm này.

## Ví dụ để trình bày trước giảng viên

Ứng viên: kỹ năng `[React]`, vị trí `Frontend Developer`, kinh nghiệm 1 năm, địa điểm Huế.

Job: kỹ năng `[React, Node]`, vị trí `Frontend Engineer`, tối thiểu 2 năm, địa điểm Hà Nội.

| Yếu tố      | Tỷ lệ | Điểm đóng góp gốc |
| ----------- | ----- | ----------------- |
| Kỹ năng     | 1/2   | 20                |
| Vị trí      | 1/2   | 12,5              |
| Kinh nghiệm | 1/2   | 10                |
| Địa điểm    | 0     | 0                 |
| Tổng        |       | 42,5 → **43%**    |

`breakdown.position` hiển thị 13 vì làm tròn thành phần. Score cuối lấy tổng chưa làm tròn rồi làm tròn một lần. Vì vậy có trường hợp tổng breakdown lệch 1 điểm so với score cuối. Hồ sơ khớp đủ cả bốn yếu tố đạt 100%; hồ sơ và job thiếu toàn bộ thông tin đạt 0 và có thông báo bổ sung dữ liệu.

## Giải thích kết quả

Reasons được sinh từ chính phép tính, không phải nội dung tĩnh gắn cho mọi job:

- Kỹ năng: tên và số lượng kỹ năng khớp trên tổng yêu cầu.
- Vị trí: phần trăm token mong muốn được khớp.
- Kinh nghiệm: đáp ứng đầy đủ hoặc bao nhiêu phần trăm yêu cầu.
- Địa điểm: cùng địa điểm mong muốn nếu bằng nhau.
- Không có điểm: nêu rõ chưa đủ thông tin phù hợp và đề nghị bổ sung hồ sơ.

Điểm này hỗ trợ khám phá công việc, không dự đoán xác suất trúng tuyển. Nhà tuyển dụng vẫn xét duyệt riêng. Trọng số là giả định nghiệp vụ do đề bài quy định, chưa được hiệu chỉnh từ dữ liệu thực tế.

## Kiểm thử và khả năng mở rộng

Unit test kiểm tra chuẩn hóa tiếng Việt, 100 điểm khi đủ điều kiện, điểm từng phần theo trọng số, dữ liệu null/thiếu/NaN/trùng, miền điểm 0–100. Integration xác minh hồ sơ/job lấy qua HTTP và tin đóng bị loại. UI test xác minh hiển thị 100% và lý do sau khi người dùng cập nhật hồ sơ.

Chi phí tính điểm xấp xỉ tuyến tính theo số job và số kỹ năng; sắp xếp `O(n log n)`. Mỗi request hiện lấy toàn bộ job mở vào bộ nhớ, không cache. Với tập dữ liệu đồ án cách này dễ kiểm tra và tránh bỏ sót trang; khi mở rộng có thể thêm tìm kiếm sơ bộ, batch scoring/cache, danh mục skill/location và đánh giá chất lượng gợi ý. Mọi thay đổi cần giữ contract và bổ sung test.
