import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  LoaderCircle,
  SearchX,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="SmartJob — Trang chủ">
      <span className="logo-mark">
        <BriefcaseBusiness size={22} />
        <span className="logo-star">✦</span>
      </span>
      <span>
        Smart<span className="text-blue-600">Job</span>
        <span className="logo-dot">.</span>
      </span>
    </Link>
  );
}
export function Loading() {
  return (
    <div className="state-box" role="status">
      <LoaderCircle className="animate-spin text-blue-600" size={30} />
      <p>Đang tải dữ liệu…</p>
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="state-box error-box" role="alert">
      <AlertCircle size={28} />
      <h3>Chưa thể tải dữ liệu</h3>
      <p>{message}</p>
      {retry && (
        <button className="btn btn-secondary" onClick={retry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = 'Chưa có dữ liệu',
  message = 'Dữ liệu sẽ xuất hiện tại đây khi có cập nhật.',
  action,
}) {
  return (
    <div className="state-box">
      <span className="empty-icon">
        <SearchX size={29} />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
export function Resource({ resource, children, emptyTitle, emptyMessage }) {
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState message={resource.error} retry={resource.reload} />;
  if (!resource.data || (resource.data.items && !resource.data.items.length))
    return <Empty title={emptyTitle} message={emptyMessage} />;
  return children(resource.data);
}
export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Pagination({ data, onPage }) {
  if (!data || data.totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        className="btn btn-secondary"
        disabled={data.page <= 1}
        onClick={() => onPage(data.page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {data.page} / {data.totalPages}
      </span>
      <button
        className="btn btn-secondary"
        disabled={data.page >= data.totalPages}
        onClick={() => onPage(data.page + 1)}
      >
        Trang sau
      </button>
    </nav>
  );
}
export function MatchBanner() {
  return (
    <div className="match-banner">
      <div className="feature-icon">
        <Sparkles size={25} />
      </div>
      <div>
        <h3>Công việc phù hợp bắt đầu từ bạn</h3>
        <p>
          Cập nhật kỹ năng và kinh nghiệm để SmartJob tìm những cơ hội gần hơn với mong muốn của
          bạn.
        </p>
      </div>
      <Link className="btn btn-white" to="/recommendations">
        Khám phá gợi ý <ArrowRight size={17} />
      </Link>
    </div>
  );
}
export function Field({ label, error, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
      {error && <small className="text-red-600">{error}</small>}
    </label>
  );
}
