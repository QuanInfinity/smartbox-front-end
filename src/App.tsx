// App.js

import { Component, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/components/Login';
import MainLayout from './pages/main_pages/components/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/Users/components/UserManagement';
import UserPermissions from './pages/Users/components/UserPermissions';
import Locker from './pages/Locker/Locker';
import LockerSizes from './pages/Locker/components/LockerSizes';
import LockerCompartments from './pages/Locker/components/LockerCompartments';
import LockerLocations from './pages/Locker/components/LockerLocations';

import Rent from './pages/Rent/Rent';
import DetailLocker from './pages/Rent/components/DetailLocker';
// import { authService } from './services/authService'; // Không cần trong file này nữa
import ProtectedRoute from './components/ProtectedRoute';

class App extends Component {
  render(): ReactNode {
    return (
      <Router>
        <Routes>
          {/* Route công khai */}
          <Route path="/login" element={<Login />} />

          {/* Các routes cần đăng nhập sẽ nằm trong MainLayout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Route mặc định khi vào "/" */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Chỉ Admin mới truy cập được */}
            <Route 
              path="users/management" 
              element={
                <ProtectedRoute requiredRoles={[1]}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users/permissions" 
              element={
                <ProtectedRoute requiredRoles={[1]}>
                  <UserPermissions />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin và Technician đều truy cập được */}
            <Route path="locker/management" element={<Locker />} />
            <Route path="locker/size-price" element={<LockerSizes />} />
            <Route path="locker/compartments" element={<LockerCompartments />} />
            <Route path="locker/locations" element={<LockerLocations />} />
          
            <Route path="rent" element={<Rent />} />
            <Route path="rent/detail/:lockerId" element={<DetailLocker />} />
          </Route>
          
          {/* Có thể thêm route cho trang 404 Not Found ở đây */}
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </Router>
    );
  }
}

export default App;
