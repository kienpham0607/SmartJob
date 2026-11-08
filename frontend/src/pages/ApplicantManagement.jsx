import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { Resource, PageHeading, Pagination } from '../components/UI.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, date, errorMessage, statuses } from '../lib/api.js';
export default function ApplicantManagement() {
  const { jobId } = useParams();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const resource = useResource(`/applications/job/${jobId}?page=${page}&limit=10`);
  const job = useResource(`/jobs/${jobId}`);
  const toast = useToast();
  async function change(id, status) {
    setBusy(id);
    try {
      await api.patch(`/applications/${id}/status`, { status });
      toast('Đã cập nhật trạng thái hồ sơ.');
      resource.reload();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="container page-shell">
      <Link className="back-link" to="/recruiter">
        <ArrowLeft size={17} /> Quản lý tuyển dụng
      </Link>
      <PageHeading
        eyebrow="KẾT NỐI VỚI ỨNG VIÊN"
        title="Hồ sơ ứng tuyển."
        description={job.data?.title || 'Xem thông tin ứng viên và cập nhật kết quả xét duyệt.'}
      />
      <p className="snapshot-note">
        Thông tin hiển thị là hồ sơ ứng viên tại thời điểm gửi đơn ứng tuyển.
      </p>
      <Resource
        resource={resource}
        emptyTitle="Đang chờ những kết nối đầu tiên"
        emptyMessage="Chưa có ứng viên nào nộp hồ sơ cho tin tuyển dụng này."
      >
        {(data) => (
          <>
            <div className="applicant-list">
              {data.items.map((item) => {
                const person = item.candidateSnapshot;
                return (
                  <article className="panel applicant-card" key={item._id}>
                    <div className="applicant-heading">
                      <span className="avatar">{person.name?.slice(0, 1)}</span>
                      <div>
                        <h2>{person.name}</h2>
                        <p>
                          {person.desiredPosition || 'Ứng viên'} · {person.experienceYears ?? 0} năm
                          kinh nghiệm
                        </p>
                      </div>
                      <label className="status-select">
                        <span className="sr-only">Trạng thái hồ sơ của {person.name}</span>
                        <select
                          value={item.status}
                          disabled={busy === item._id}
                          onChange={(event) => change(item._id, event.target.value)}
                        >
                          {Object.entries(statuses).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="applicant-contact">
                      <span>
                        <Mail size={15} />
                        {person.email}
                      </span>
                      {person.phone && (
                        <span>
                          <Phone size={15} />
                          {person.phone}
                        </span>
                      )}
                      {person.location && (
                        <span>
                          <MapPin size={15} />
                          {person.location}
                        </span>
                      )}
                      <span>
                        <Clock3 size={15} />
                        {date(item.createdAt)}
                      </span>
                    </div>
                    <div className="skill-tags">
                      {person.skills?.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                    {person.bio && (
                      <div className="applicant-text">
                        <strong>Giới thiệu</strong>
                        <p>{person.bio}</p>
                      </div>
                    )}
                    {item.coverLetter && (
                      <div className="applicant-text">
                        <strong>Lời giới thiệu ứng tuyển</strong>
                        <p>{item.coverLetter}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            <Pagination data={data} onPage={setPage} />
          </>
        )}
      </Resource>
    </div>
  );
}
