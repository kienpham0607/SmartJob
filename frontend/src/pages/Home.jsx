import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Resource, MatchBanner } from '../components/UI.jsx';
import JobCard from '../components/JobCard.jsx';
export default function Home() {
  const jobs = useResource('/jobs?limit=6');
  const { user } = useAuth();
  const navigate = useNavigate();
  function search(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form) if (value.trim()) params.set(key, value.trim());
    navigate(`/jobs?${params}`);
  }
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="live-dot" /> MỖI KỸ NĂNG, MỘT CƠ HỘI MỚI
            </div>
            <h1>
              Công việc phù hợp.
              <br />
              <span>Tương lai rộng mở.</span>
              <svg viewBox="0 0 400 20" aria-hidden="true">
                <path d="M3 13 Q180 -5 395 9" />
              </svg>
            </h1>
            <p>
              Đừng chỉ tìm một công việc. Hãy tìm nơi bạn có thể tỏa sáng.
              <br className="desktop-break" /> SmartJob kết nối bạn với cơ hội phù hợp với chính
              mình.
            </p>
            <div className="hero-trust">
              <span>
                <ShieldCheck size={16} /> Cơ hội minh bạch
              </span>
              <span>
                <Sparkles size={16} /> Gợi ý theo hồ sơ
              </span>
              <span>
                <Check size={16} /> Hoàn toàn miễn phí
              </span>
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label="Gợi ý theo kỹ năng, vị trí, kinh nghiệm và địa điểm"
          >
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="visual-spark spark-one">✦</span>
            <span className="visual-spark spark-two">✧</span>
            <div className="floating-label">
              <span className="mini-icon">
                <Target size={18} />
              </span>{' '}
              Đúng người, đúng cơ hội <Check size={14} />
            </div>
            <div className="match-preview">
              <div className="preview-head">
                <span className="mini-icon">
                  <Sparkles size={20} />
                </span>
                <div>
                  <strong>Khám phá độ phù hợp</strong>
                  <small>Hiểu bạn từ những điều quan trọng</small>
                </div>
                <span className="preview-dot">•••</span>
              </div>
              <div className="score-visual">
                <div className="score-ring">
                  <div>
                    <span>4</span>
                    <small>yếu tố kết nối</small>
                  </div>
                </div>
                <div className="score-caption">
                  <span className="eyebrow">CƠ HỘI CỦA RIÊNG BẠN</span>
                  <strong>
                    Mỗi hồ sơ,
                    <br />
                    một hành trình.
                  </strong>
                  <span className="personalized">
                    <span className="live-dot" /> Cá nhân hóa gợi ý
                  </span>
                </div>
              </div>
              <div className="weight-grid">
                {[
                  ['Kỹ năng', 40],
                  ['Vị trí mong muốn', 25],
                  ['Kinh nghiệm', 20],
                  ['Địa điểm', 15],
                ].map(([name, weight]) => (
                  <div key={name}>
                    <span>
                      {name}
                      <b>{weight}%</b>
                    </span>
                    <i>
                      <i style={{ width: `${weight * 2}%` }} />
                    </i>
                  </div>
                ))}
              </div>
              <div className="preview-bottom">
                <ShieldCheck size={14} /> Thuật toán rõ ràng. Gợi ý có giải thích.
              </div>
            </div>
            <div className="visual-bottom-note">
              <span className="mini-icon">
                <TrendingUp size={20} />
              </span>
              <div>
                <strong>Phù hợp hơn, tiến xa hơn</strong>
                <small>Bắt đầu từ những kỹ năng của bạn</small>
              </div>
              <ArrowUpRight size={19} />
            </div>
          </div>
        </div>
        <div className="container search-wrap">
          <form className="hero-search" onSubmit={search}>
            <div className="search-input">
              <Search size={21} />
              <input
                name="q"
                aria-label="Từ khóa việc làm"
                placeholder="Vị trí, kỹ năng hoặc tên công ty…"
              />
            </div>
            <div className="search-location">
              <MapPin size={21} />
              <select name="location" aria-label="Địa điểm làm việc">
                <option value="">Tất cả địa điểm</option>
                <option>Hà Nội</option>
                <option>TP. Hồ Chí Minh</option>
                <option>Đà Nẵng</option>
                <option>Remote</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit">
              <Search size={19} /> Tìm việc ngay
            </button>
          </form>
          <div className="popular-search">
            <span>Tìm kiếm phổ biến:</span>
            {['Frontend', 'Backend', 'React', 'Thực tập'].map((q) => (
              <Link key={q} to={`/jobs?q=${encodeURIComponent(q)}`}>
                {q}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="intro-strip">
        <div className="container intro-grid">
          <div>
            <span className="strip-icon">
              <Target size={22} />
            </span>
            <div>
              <strong>Tìm đúng cơ hội</strong>
              <p>Theo kỹ năng và định hướng của bạn</p>
            </div>
          </div>
          <div>
            <span className="strip-icon">
              <SlidersHorizontal size={22} />
            </span>
            <div>
              <strong>Chủ động lựa chọn</strong>
              <p>Lọc vị trí, địa điểm và mức lương</p>
            </div>
          </div>
          <div>
            <span className="strip-icon">
              <UsersRound size={22} />
            </span>
            <div>
              <strong>Kết nối dễ dàng</strong>
              <p>Ứng tuyển và theo dõi tại một nơi</p>
            </div>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BƯỚC TIẾP THEO CỦA BẠN</span>
            <h2>
              Cơ hội mới, mỗi ngày<span className="text-blue-600">.</span>
            </h2>
            <p>Khám phá những vị trí đang chờ một người như bạn.</p>
          </div>
          <Link className="text-link" to="/jobs">
            Xem tất cả việc làm <ArrowRight size={17} />
          </Link>
        </div>
        <Resource
          resource={jobs}
          emptyTitle="Những cơ hội đầu tiên đang được chuẩn bị"
          emptyMessage="Hiện chưa có tin tuyển dụng đang mở. Hãy quay lại sau hoặc đăng tin nếu bạn là nhà tuyển dụng."
        >
          {(data) => (
            <div className="job-grid">
              {data.items.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </Resource>
      </section>
      <section className="container">
        <MatchBanner />
      </section>
      <section className="section container journey-section">
        <div>
          <span className="eyebrow">ĐƠN GIẢN ĐỂ BẮT ĐẦU</span>
          <h2>
            Chạm đến công việc mới <br />
            trong ba bước.
          </h2>
          <p>
            Để thời gian của bạn dành cho điều quan trọng:
            <br />
            chuẩn bị cho một khởi đầu tốt hơn.
          </p>
          <Link className="text-link" to={user ? '/profile' : '/register'}>
            {user ? 'Hoàn thiện hồ sơ' : 'Tạo hồ sơ miễn phí'} <ArrowRight size={17} />
          </Link>
        </div>
        <div className="journey-steps">
          {[
            ['01', 'Kể câu chuyện của bạn', 'Thêm kỹ năng, kinh nghiệm và vị trí bạn mong muốn.'],
            [
              '02',
              'Khám phá cơ hội phù hợp',
              'Tìm kiếm chủ động hoặc xem gợi ý kèm lý do phù hợp.',
            ],
            [
              '03',
              'Tự tin gửi lời ứng tuyển',
              'Kết nối với nhà tuyển dụng và theo dõi hồ sơ dễ dàng.',
            ],
          ].map(([number, title, desc]) => (
            <div className="journey-step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <ArrowUpRight size={19} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
