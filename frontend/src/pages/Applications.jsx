import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { PageHeading, Pagination, Resource } from '../components/UI.jsx';
import { date, statuses } from '../lib/api.js';
export default function Applications() {
  const [page, setPage] = useState(1);
  const resource = useResource(`/applications/me?page=${page}&limit=10`);
  return (
    <div className="container page-shell">
      <PageHeading
        eyebrow="HÀNH TRÌNH ỨNG TUYỂN"
        title="Những cơ hội bạn đã chọn."
        description="Theo dõi hồ sơ và từng bước tiến trên hành trình nghề nghiệp."
        action={
          <Link className="btn btn-primary" to="/jobs">
            Tìm thêm cơ hội <ArrowUpRight size={17} />
          </Link>
        }
      />
      <Resource
        resource={resource}
        emptyTitle="Hành trình ứng tuyển bắt đầu từ đây"
        emptyMessage="Bạn chưa gửi hồ sơ nào. Hãy khám phá công việc và chọn cơ hội phù hợp với mình."
      >
        {(data) => (
          <>
            <div className="application-list">
              {data.items.map((item) => (
                <article className="panel application-card" key={item._id}>
                  <span className="company-logo blue">
                    {item.jobSnapshot.companyName?.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="application-main">
                    <Link to={`/jobs/${item.jobId}`}>{item.jobSnapshot.title}</Link>
                    <p>{item.jobSnapshot.companyName}</p>
                    <div className="job-meta">
                      <span>
                        <MapPin size={14} />
                        {item.jobSnapshot.location}
                      </span>
                      <span>
                        <Clock3 size={14} />
                        Ứng tuyển {date(item.createdAt)}
                      </span>
                    </div>
                    {item.coverLetter && <p className="application-letter">{item.coverLetter}</p>}
                  </div>
                  <div className="application-status">
                    <span className={`status ${item.status}`}>{statuses[item.status]}</span>
                    <Link className="text-link" to={`/jobs/${item.jobId}`}>
                      Xem công việc <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <Pagination data={data} onPage={setPage} />
          </>
        )}
      </Resource>
    </div>
  );
}
