import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, errorMessage, jobTypes } from '../lib/api.js';
import { PageHeading, Resource, Field, ErrorState } from '../components/UI.jsx';
export default function JobForm() {
  const { id } = useParams();
  const resource = useResource(id ? `/jobs/${id}` : null);
  const { user } = useAuth();
  return (
    <div className="container page-shell narrow">
      <Link className="back-link" to="/recruiter">
        <ArrowLeft size={17} /> Quản lý tuyển dụng
      </Link>
      <PageHeading
        eyebrow="KẾT NỐI NHÂN TÀI"
        title={id ? 'Chỉnh sửa tin tuyển dụng.' : 'Cơ hội mới cho đồng đội mới.'}
        description="Thông tin rõ ràng giúp bạn tìm thấy những ứng viên phù hợp."
      />
      {id ? (
        <Resource resource={resource}>
          {(job) =>
            job.recruiterId === user._id ? (
              <Editor job={job} />
            ) : (
              <ErrorState message="Bạn không sở hữu tin tuyển dụng này." />
            )
          }
        </Resource>
      ) : (
        <Editor
          job={{
            companyName: user.companyName,
            location: user.location,
            requiredSkills: [],
            status: 'open',
            jobType: 'FULL_TIME',
            experienceMin: 0,
            salaryMin: 0,
            salaryMax: 0,
          }}
        />
      )}
    </div>
  );
}
function Editor({ job }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  async function submit(event) {
    event.preventDefault();
    setError('');
    const input = Object.fromEntries(new FormData(event.currentTarget));
    input.requiredSkills = input.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const key of ['salaryMin', 'salaryMax', 'experienceMin']) input[key] = Number(input[key]);
    if (input.salaryMax < input.salaryMin) {
      setError('Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.');
      return;
    }
    setBusy(true);
    try {
      if (job._id) await api.put(`/jobs/${job._id}`, input);
      else await api.post('/jobs', input);
      toast(job._id ? 'Đã cập nhật tin tuyển dụng.' : 'Đã đăng tin tuyển dụng thành công.');
      navigate('/recruiter');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel profile-form" onSubmit={submit}>
      <h2>Thông tin vị trí tuyển dụng</h2>
      <div className="form-grid">
        <div className="span-2">
          <Field
            label="Tên công việc"
            name="title"
            defaultValue={job.title}
            required
            maxLength={150}
            placeholder="Ví dụ: Frontend Developer (React)"
          />
        </div>
        <Field
          label="Tên công ty"
          name="companyName"
          defaultValue={job.companyName}
          required
          maxLength={150}
        />
        <Field
          label="Địa điểm làm việc"
          name="location"
          defaultValue={job.location}
          required
          maxLength={150}
        />
        <Field
          label="Lương tối thiểu (VND / tháng)"
          name="salaryMin"
          type="number"
          min="0"
          max="10000000000"
          required
          defaultValue={job.salaryMin}
        />
        <Field
          label="Lương tối đa (VND / tháng)"
          name="salaryMax"
          type="number"
          min="0"
          max="10000000000"
          required
          defaultValue={job.salaryMax}
        />
        <Field
          label="Số năm kinh nghiệm tối thiểu"
          name="experienceMin"
          type="number"
          min="0"
          max="60"
          step="0.5"
          required
          defaultValue={job.experienceMin}
        />
        <Field label="Hình thức làm việc">
          <select name="jobType" defaultValue={job.jobType}>
            {Object.entries(jobTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <div className="span-2">
          <Field
            label="Kỹ năng yêu cầu (phân cách bằng dấu phẩy)"
            name="requiredSkills"
            maxLength={2400}
            defaultValue={job.requiredSkills.join(', ')}
            placeholder="React, JavaScript, Git…"
          />
        </div>
        <div className="span-2">
          <Field label="Mô tả công việc, yêu cầu và quyền lợi">
            <textarea
              name="description"
              defaultValue={job.description}
              required
              rows={10}
              maxLength={15000}
              placeholder="Mô tả nhiệm vụ, yêu cầu ứng viên và những điều công ty mang lại…"
            />
          </Field>
        </div>
        <Field label="Trạng thái tuyển dụng">
          <select name="status" defaultValue={job.status}>
            <option value="open">Mở tuyển dụng</option>
            <option value="closed">Đóng tuyển dụng</option>
          </select>
        </Field>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Link className="btn btn-secondary" to="/recruiter">
          Hủy
        </Link>
        <button className="btn btn-primary" disabled={busy}>
          {job._id ? <Save size={17} /> : <Send size={17} />}{' '}
          {busy ? 'Đang lưu…' : job._id ? 'Lưu thay đổi' : 'Đăng tin tuyển dụng'}
        </button>
      </div>
    </form>
  );
}
