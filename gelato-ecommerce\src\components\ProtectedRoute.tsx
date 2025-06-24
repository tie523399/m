import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  // 如果未認證，重定向到登入頁面
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // 如果已認證但不是管理員，重定向到首頁
  if (user && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;"
