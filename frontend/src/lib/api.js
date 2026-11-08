import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 12000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('smartjob-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization)
      window.dispatchEvent(new Event('smartjob:unauthorized'));
    return Promise.reject(error);
  },
);
export const errorMessage = (error) => {
  const details = error?.response?.data?.error?.details;
  return details?.length
    ? details.map((d) => `${d.field}: ${d.message}`).join(' • ')
    : error?.response?.data?.error?.message ||
        'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
};
export const salary = (job) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(job.salaryMin / 1000000)} – ${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(job.salaryMax / 1000000)} triệu`;
export const date = (value) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(value),
  );
export const jobTypes = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  INTERNSHIP: 'Thực tập',
  CONTRACT: 'Hợp đồng',
};
export const statuses = {
  pending: 'Đã gửi hồ sơ',
  reviewing: 'Đang xem xét',
  accepted: 'Được chấp nhận',
  rejected: 'Chưa phù hợp',
};
