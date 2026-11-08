import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, Sparkles } from 'lucide-react';
import { api, errorMessage } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from '../components/UI.jsx';
export default function Auth({ register = false }) {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (register) values.role = role;
    try {
      const response = await api.post(`/auth/${register ? 'register' : 'login'}`, values);
      login(response.data.data);
      toast(
        register
          ? 'Tạo tài khoản thành công. Chào mừng bạn đến SmartJob!'
          : 'Đăng nhập thành công. Chào mừng bạn trở lại!',
      );
      navigate(
        location.state?.from ||
          (response.data.data.user.role === 'RECRUITER'
            ? '/recruiter'
            : register
              ? '/profile'
              : '/recommendations'),
        { replace: true },
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-shell">
      <div className="auth-story">
        <div className="hero-eyebrow">
          <Sparkles size={17} /> MỘT KHỞI ĐẦU MỚI
        </div>
        <h1>
          {register ? (
            <>
              Cơ hội tốt hơn.
              <br />
              Bắt đầu từ bạn.
            </>
          ) : (
            <>
              Chào bạn trở lại.
              <br />
              Tiếp bước hành trình.
            </>
          )}
        </h1>
        <p>
          Mỗi kỹ năng đều xứng đáng tìm được nơi để tỏa sáng. SmartJob giúp bạn kết nối với cơ hội
          của riêng mình.
        </p>
        <div className="auth-benefits">
          {[
            'Khám phá việc làm theo kỹ năng và định hướng',
            'Hiểu rõ vì sao một công việc phù hợp với bạn',
            'Ứng tuyển và theo dõi hồ sơ tại cùng một nơi',
          ].map((text) => (
            <div key={text}>
              <CheckCircle2 size={20} />
              {text}
            </div>
          ))}
        </div>
        <div className="auth-art">
          <div>
            your next
            <br />
            <span>chapter.</span>
          </div>
          <span>✦</span>
        </div>
      </div>
      <div className="auth-form-wrap">
        <span className="eyebrow">CHÀO MỪNG ĐẾN SMARTJOB</span>
        <h2>{register ? 'Tạo tài khoản miễn phí' : 'Đăng nhập tài khoản'}</h2>
        <p>
          {register
            ? 'Một vài thông tin để bắt đầu hành trình của bạn.'
            : 'Công việc tiếp theo đang chờ bạn khám phá.'}
        </p>
        {register && (
          <div className="role-switch">
            <button
              type="button"
              className={role === 'CANDIDATE' ? 'active' : ''}
              onClick={() => setRole('CANDIDATE')}
            >
              Tôi tìm việc
            </button>
            <button
              type="button"
              className={role === 'RECRUITER' ? 'active' : ''}
              onClick={() => setRole('RECRUITER')}
            >
              Tôi tuyển dụng
            </button>
          </div>
        )}
        <form onSubmit={submit}>
          {register && (
            <Field
              label="Họ và tên"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              placeholder="Nguyễn Minh Anh"
            />
          )}
          <Field
            label="Địa chỉ email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="ban@example.com"
          />
          <label className="field">
            <span>Mật khẩu</span>
            <div className="password-input">
              <input
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={8}
                maxLength={72}
                placeholder={register ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu của bạn'}
              />
              <button
                type="button"
                aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <>
                {register ? 'Tạo tài khoản' : 'Đăng nhập'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        <div className="auth-alternate">
          {register ? 'Bạn đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
          <Link to={register ? '/login' : '/register'} state={location.state}>
            {register ? 'Đăng nhập' : 'Đăng ký miễn phí'}
          </Link>
        </div>
        <p className="auth-security">
          Thông tin của bạn được sử dụng để kết nối cơ hội việc làm và xử lý hồ sơ ứng tuyển.
        </p>
      </div>
    </div>
  );
}
