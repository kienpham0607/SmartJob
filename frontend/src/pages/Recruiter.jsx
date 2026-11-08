import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FilePenLine,
  Plus,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { PageHeading, Resource, Pagination } from '../components/UI.jsx';
import { api, date, errorMessage } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
export function jobPayload(job) {
  const keys = [
    'title',
    'description',
    'companyName',
    'location',
    'salaryMin',
    'salaryMax',
    'requiredSkills',
    'experienceMin',
    'jobType',
    'status',
  ];
  return Object.fromEntries(keys.map((key) => [key, job[key]]));
}
export default function Recruiter() {
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const resource = useResource(`/jobs/my-jobs?page=${page}&limit=10`);
  const toast = useToast();
  async function toggle(job) {
    setBusy(job._id);
    try {
      await api.put(`/jobs/${job._id}`, {
        ...jobPayload(job),
        status: job.status === 'open' ? 'closed' : 'open',
      });
      toast('Đã cập nhật trạng thái tin tuyển dụng.');
      resource.reload();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setBusy('');
    }
  }
  async function remove(job) {
    if (
      !window.confirm(
        `Xóa tin “${job.title}”? Hồ sơ đã nộp vẫn lưu trong lịch sử ứng viên, nhưng bạn sẽ không thể quản lý các hồ sơ gắn với tin đã xóa.`,
      )
    )
      return;
    setBusy(job._id);
    try {
      await api.delete(`/jobs/${job._id}`);
      toast('Đã xóa tin tuyển dụng.');
      if (resource.data.items.length === 1 && page > 1) setPage(page - 1);
      else resource.reload();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="container page-shell">
      <PageHeading
        eyebrow="KHÔNG GIAN NHÀ TUYỂN DỤNG"
        title="Tìm đồng đội tiếp theo."
        description="Quản lý tin tuyển dụng và kết nối với những ứng viên phù hợp."
        action={
          <Link className="btn btn-primary" to="/recruiter/jobs/new">
            <Plus size={18} /> Đăng tin tuyển dụng
          </Link>
        }
      />
      <div className="dashboard-intro">
        <div>
          <BriefcaseBusiness size={25} />
          <div>
            <span>Tổng số tin tuyển dụng của bạn</span>
            <strong>{resource.data?.total ?? '—'}</strong>
          </div>
        </div>
        <Link to="/profile">
          <UsersRound size={25} />
          <div>
            <strong>Hồ sơ doanh nghiệp</strong>
            <span>Cập nhật thông tin để ứng viên hiểu bạn hơn</span>
          </div>
          <ArrowUpRight size={20} />
        </Link>
      </div>
      <div className="results-heading">
        <h2>Tin tuyển dụng của bạn</h2>
        <span>Quản lý toàn bộ tin đang mở và đã đóng</span>
      </div>
      <Resource
        resource={resource}
        emptyTitle="Chào đón những đồng đội đầu tiên"
        emptyMessage="Bạn chưa có tin tuyển dụng nào. Tạo tin mới để ứng viên có thể tìm thấy công ty của bạn."
      >
        {(data) => (
          <>
            <div className="panel table-scroll">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Vị trí tuyển dụng</th>
                    <th>Ngày đăng</th>
                    <th>Trạng thái</th>
                    <th>Hồ sơ</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <Link className="table-title" to={`/jobs/${job._id}`}>
                          {job.title}
                        </Link>
                        <small>
                          {job.companyName} · {job.location}
                        </small>
                      </td>
                      <td>{date(job.createdAt)}</td>
                      <td>
                        <button
                          disabled={busy === job._id}
                          className={`status status-button ${job.status}`}
                          onClick={() => toggle(job)}
                          title="Nhấn để đóng hoặc mở tin"
                        >
                          {job.status === 'open' ? 'Đang tuyển · Đóng tin' : 'Đã đóng · Mở lại'}
                        </button>
                      </td>
                      <td>
                        <Link className="text-link" to={`/recruiter/jobs/${job._id}/applications`}>
                          <UsersRound size={16} /> Xem hồ sơ
                        </Link>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            className="icon-button"
                            aria-label={`Sửa tin ${job.title}`}
                            to={`/recruiter/jobs/${job._id}/edit`}
                          >
                            <FilePenLine size={18} />
                          </Link>
                          <button
                            className="icon-button danger"
                            aria-label={`Xóa tin ${job.title}`}
                            disabled={busy === job._id}
                            onClick={() => remove(job)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination data={data} onPage={setPage} />
          </>
        )}
      </Resource>
    </div>
  );
}
