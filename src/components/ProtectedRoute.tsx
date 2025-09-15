import { Component, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Result, Button } from 'antd';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: number[]; // [1] for admin only, [1,2] for admin and technician
}

class ProtectedRoute extends Component<ProtectedRouteProps> {
  render(): ReactNode {
    const { children, requiredRoles } = this.props;
    
    if (!authService.isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    if (requiredRoles && !authService.hasPermission(requiredRoles)) {
      return (
        <Result
          status="403"
          title="403"
          subTitle="Bạn không có quyền truy cập trang này."
          extra={<Button type="primary" onClick={() => window.history.back()}>Quay lại</Button>}
        />
      );
    }
    
    return children;
  }
}

export default ProtectedRoute;
