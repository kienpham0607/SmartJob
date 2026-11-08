import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Search, Sparkles, ArrowRight, MapPin } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { PageHeading, Resource, Pagination } from '../components/UI.jsx';
import JobCard from '../components/JobCard.jsx';
export default function Jobs({ recommended = false }) {
  const [params, setParams] = useSearchParams();
  const query = new URLSearchParams(params);
  query.set('limit', '9');
  const resource = useResource(`/${recommended ? 'recommendations/me' : 'jobs'}?${query}`);
  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget))
      if (value.trim()) next.set(key, value.trim());
    setParams(next);
  }
  function page(value) {
    const next = new URLSearchParams(params);
    next.set('page', value);
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  return (
    <div className="page-shell container">
      <PageHeading
        eyebrow={recommended ? 'GỢI Ý DÀNH RIÊNG CHO BẠN' : 'KHÁM PHÁ CƠ HỘI'}
        title={recommended ? 'Công việc hợp với bạn.' : 'Tìm công việc tiếp theo.'}
        description={
          recommended
            ? 'Xếp hạng theo kỹ năng, vị trí, kinh nghiệm và địa điểm trong hồ sơ của bạn.'
            : 'Một bước tìm kiếm. Thêm một cơ hội để tiến xa.'
        }
        action={
          recommended && (
            <Link className="btn btn-secondary" to="/profile">
              Cập nhật hồ sơ <ArrowRight size={16} />
            </Link>
          )
        }
      />
      {recommended ? (
        <div className="recommendation-explainer">
          <Sparkles size={22} />
          <p>
            Mức độ phù hợp được tính từ <b>kỹ năng 40%</b>, <b>vị trí 25%</b>,{' '}
            <b>kinh nghiệm 20%</b> và <b>địa điểm 15%</b>. Mỗi gợi ý đều có lý do để bạn tự tin lựa
            chọn.
          </p>
        </div>
      ) : (
        <form className="filter-bar" onSubmit={submit} key={params.toString()}>
          <div className="filter-keyword">
            <Search size={19} />
            <input
              name="q"
              aria-label="Từ khóa"
              placeholder="Tên công việc, công ty…"
              defaultValue={params.get('q') || ''}
            />
          </div>
          <div className="filter-location">
            <MapPin size={18} />
            <input
              name="location"
              aria-label="Địa điểm"
              placeholder="Địa điểm"
              defaultValue={params.get('location') || ''}
            />
          </div>
          <input
            name="skill"
            aria-label="Kỹ năng"
            placeholder="Kỹ năng, ví dụ: react"
            defaultValue={params.get('skill') || ''}
          />
          <input
            name="salaryMin"
            aria-label="Lương tối thiểu VND"
            type="number"
            min="0"
            placeholder="Lương từ (VND)"
            defaultValue={params.get('salaryMin') || ''}
          />
          <input
            name="salaryMax"
            aria-label="Lương tối đa VND"
            type="number"
            min="0"
            placeholder="Lương đến (VND)"
            defaultValue={params.get('salaryMax') || ''}
          />
          <button className="btn btn-primary">
            <Filter size={17} /> Áp dụng
          </button>
          {params.size > 0 && (
            <button className="reset-filter" type="button" onClick={() => setParams({})}>
              Xóa bộ lọc
            </button>
          )}
        </form>
      )}
      <div className="results-heading">
        <h2>
          {resource.data
            ? `${resource.data.total} ${recommended ? 'cơ hội được gợi ý' : 'việc làm được tìm thấy'}`
            : 'Danh sách cơ hội'}
        </h2>
        <span>{recommended ? 'Mức độ phù hợp cao nhất' : 'Mới nhất trước'}</span>
      </div>
      <Resource
        resource={resource}
        emptyTitle={
          recommended ? 'Chưa có công việc đang tuyển' : 'Chưa tìm thấy công việc phù hợp'
        }
        emptyMessage={
          recommended
            ? 'Hãy cập nhật hồ sơ và quay lại khi có tin tuyển dụng mới.'
            : 'Thử thay đổi từ khóa, kỹ năng hoặc mở rộng địa điểm tìm kiếm.'
        }
      >
        {(data) => (
          <>
            <div className="job-grid">
              {data.items.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
            <Pagination data={data} onPage={page} />
          </>
        )}
      </Resource>
      {!recommended && (
        <div className="search-tip">
          <Sparkles size={22} />
          <div>
            <strong>Để cơ hội tự tìm đến bạn.</strong>
            <p>Thêm kỹ năng vào hồ sơ để xem danh sách được sắp xếp theo độ phù hợp.</p>
          </div>
          <Link className="text-link" to="/recommendations">
            Xem gợi ý <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </div>
  );
}
