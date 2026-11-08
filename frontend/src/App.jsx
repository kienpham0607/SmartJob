import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Empty, ErrorState, Loading } from './components/UI.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
const Auth = lazy(() => import('./pages/Auth.jsx'));
const Jobs = lazy(() => import('./pages/Jobs.jsx'));
const JobDetail = lazy(() => import('./pages/JobDetail.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Applications = lazy(() => import('./pages/Applications.jsx'));
const Recruiter = lazy(() => import('./pages/Recruiter.jsx'));
const JobForm = lazy(() => import('./pages/JobForm.jsx'));
const ApplicantManagement = lazy(() => import('./pages/ApplicantManagement.jsx'));
function Protected({ role }) {
  const { user, loading, sessionError, retrySession } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (sessionError)
    return (
      <div className="container page-shell">
        <ErrorState message={sessionError} retry={retrySession} />
      </div>
    );
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role && user.role !== role)
    return (
      <div className="container page-shell">
        <Empty
          title="Trang này dành cho vai trò khác"
          message={
            role === 'CANDIDATE'
              ? 'Tính năng này dành cho tài khoản ứng viên.'
              : 'Tính năng này dành cho tài khoản nhà tuyển dụng.'
          }
          action={
            <Link className="btn btn-primary" to="/">
              Về trang chủ
            </Link>
          }
        />
      </div>
    );
  return <Outlet />;
}
export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Auth key="login" />} />
          <Route path="register" element={<Auth key="register" register />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route element={<Protected />}>
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route element={<Protected role="CANDIDATE" />}>
            <Route path="recommendations" element={<Jobs recommended />} />
            <Route path="applications" element={<Applications />} />
          </Route>
          <Route element={<Protected role="RECRUITER" />}>
            <Route path="recruiter" element={<Recruiter />} />
            <Route path="recruiter/jobs/new" element={<JobForm />} />
            <Route path="recruiter/jobs/:id/edit" element={<JobForm />} />
            <Route path="recruiter/jobs/:jobId/applications" element={<ApplicantManagement />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="container page-shell">
                <Empty
                  title="Trang bạn tìm không tồn tại"
                  message="Khám phá những cơ hội mới tại trang chủ SmartJob."
                  action={
                    <Link className="btn btn-primary" to="/">
                      Về trang chủ
                    </Link>
                  }
                />
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
