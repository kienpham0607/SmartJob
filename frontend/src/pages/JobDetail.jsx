import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Send,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { Resource } from '../components/UI.jsx';
import { api, date, errorMessage, jobTypes, salary } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
export default function JobDetail() {
  const { id } = useParams();
  const resource = useResource(`/jobs/${id}`);
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  async function apply(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/applications', {
        jobId: id,
        coverLetter: new FormData(event.currentTarget).get('coverLetter'),
      });
      setSubmitted(true);
      toast('Đã gửi hồ sơ ứng tuyển thành công!');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page-shell">
      <Link className="back-link" to="/jobs">
        <ArrowLeft size={17} /> Tất cả việc làm
      </Link>
      <Resource resource={resource}>
        {(job) => (
          <>
            <div className="detail-heading panel">
              <span className="company-logo blue large">
                {job.companyName.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <span className={`status ${job.status}`}>
                  {job.status === 'open' ? 'Đang tuyển dụng' : 'Đã đóng tuyển dụng'}
                </span>
                <h1>{job.title}</h1>
                <p>{job.companyName}</p>
                <div className="job-meta">
                  <span>
                    <MapPin size={15} />
                    {job.location}
                  </span>
                  <span>
                    <CalendarDays size={15} />
                    Đăng ngày {date(job.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="detail-layout">
              <div>
                <section className="panel detail-content">
                  <h2>Mô tả công việc</h2>
                  <div className="prose-copy">{job.description}</div>
                  <h2>Kỹ năng cần có</h2>
                  <div className="skill-tags large-tags">
                    {job.requiredSkills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                  {!job.requiredSkills.length && <p>Nhà tuyển dụng chưa yêu cầu kỹ năng cụ thể.</p>}
                  <h2>Thông tin tuyển dụng</h2>
                  <dl className="detail-facts">
                    <div>
                      <dt>
                        <Wallet size={18} />
                        Mức lương / tháng
                      </dt>
                      <dd>{salary(job)} VNĐ</dd>
                    </div>
                    <div>
                      <dt>
                        <BriefcaseBusiness size={18} />
                        Hình thức làm việc
                      </dt>
                      <dd>{jobTypes[job.jobType]}</dd>
                    </div>
                    <div>
                      <dt>
                        <ShieldCheck size={18} />
                        Kinh nghiệm tối thiểu
                      </dt>
                      <dd>{job.experienceMin} năm</dd>
                    </div>
                    <div>
                      <dt>
                        <MapPin size={18} />
                        Địa điểm
                      </dt>
                      <dd>{job.location}</dd>
                    </div>
                  </dl>
                </section>
              </div>
              <aside>
                <section className="panel apply-panel">
                  <span className="eyebrow">CƠ HỘI TIẾP THEO</span>
                  <h2>
                    Sẵn sàng cho
                    <br />
                    một khởi đầu mới?
                  </h2>
                  <p>Hồ sơ hiện tại của bạn sẽ được gửi đến nhà tuyển dụng cùng lời giới thiệu.</p>
                  {job.status !== 'open' ? (
                    <div className="notice">Tin tuyển dụng này đã đóng.</div>
                  ) : !user ? (
                    <Link
                      className="btn btn-primary w-full"
                      to="/login"
                      state={{ from: location.pathname }}
                    >
                      Đăng nhập để ứng tuyển <ArrowUpRight size={17} />
                    </Link>
                  ) : user.role === 'RECRUITER' ? (
                    job.recruiterId === user._id ? (
                      <Link
                        className="btn btn-primary w-full"
                        to={`/recruiter/jobs/${id}/applications`}
                      >
                        Quản lý hồ sơ ứng tuyển
                      </Link>
                    ) : (
                      <div className="notice">Tài khoản nhà tuyển dụng đang xem tin.</div>
                    )
                  ) : submitted ? (
                    <div className="success-note">
                      <CheckCircle2 size={22} />
                      Đã gửi hồ sơ!<Link to="/applications">Theo dõi trạng thái</Link>
                    </div>
                  ) : (
                    <form onSubmit={apply}>
                      <label className="field">
                        <span>
                          Lời giới thiệu <small>(không bắt buộc)</small>
                        </span>
                        <textarea
                          name="coverLetter"
                          maxLength={5000}
                          rows={5}
                          placeholder="Chia sẻ ngắn gọn vì sao bạn phù hợp với vị trí này…"
                        />
                      </label>
                      <button disabled={busy} className="btn btn-primary w-full">
                        <Send size={17} />
                        {busy ? 'Đang gửi…' : 'Ứng tuyển ngay'}
                      </button>
                      <Link className="profile-hint" to="/profile">
                        Xem lại hồ sơ trước khi gửi <ArrowUpRight size={13} />
                      </Link>
                    </form>
                  )}
                </section>
                <div className="security-note">
                  <ShieldCheck size={22} />
                  <p>Chủ động bảo vệ thông tin cá nhân. Không chuyển phí để được nhận việc.</p>
                </div>
              </aside>
            </div>
          </>
        )}
      </Resource>
    </div>
  );
}
