import { Component, type ReactNode } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  SettingOutlined,  
  DownOutlined,
  CalendarOutlined, 
  ControlOutlined,
  DollarOutlined,
  PartitionOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  SolutionOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Outlet, Link } from 'react-router-dom';
import { authService } from '../../../services/authService';

const { Header, Sider, Content } = Layout;

interface MainLayoutState {
  collapsed: boolean;
}

class MainLayoutComponent extends Component<{}, MainLayoutState> {
  state = {
    collapsed: false
  };

  handleMenuClick = (key: string) => {
    switch (key) {
      case 'logout':
        authService.logout();
        window.location.href = '/login';
        break;
      case 'profile':
        // Handle profile action
        break;
      case 'settings':
        // Handle settings action
        break;
    }
  };

  render(): ReactNode {
    const userInfo = authService.getUserInfo();
    const isAdmin = userInfo?.role_id === 1;
    const isTechnician = userInfo?.role_id === 2;

    const userMenuItems = [
      { key: 'logout', label: 'Đăng xuất' }
    ];

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          collapsible 
          collapsed={this.state.collapsed}
          onCollapse={(collapsed) => this.setState({ collapsed })}
          style={{ background: '#001529' }}
          width={250}
        >
          <div style={{ 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold'
          }}> 
            <AppstoreOutlined />
            SmartBox
          </div>
          
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            defaultOpenKeys={['locker']}
            style={{ borderRight: 0 }}
          >
            
           
            {/* Chỉ Admin mới thấy menu Users */}
            {isAdmin && (
              <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                <Link to="/dashboard">Tổng quan</Link>
              </Menu.Item>
            )}
             <Menu.Item key="rent" icon={<CalendarOutlined />}>
              <Link to="/rent">Thuê tủ</Link>
            </Menu.Item>  
            
            
            {/* Admin và Technician đều truy cập được */}
            {(isAdmin || isTechnician) && (
              <Menu.SubMenu key="locker" icon={<ControlOutlined />} title="Quản lý & thiết lập">
                <Menu.Item key="locker-management" icon={<DatabaseOutlined />}>
                  <Link to="/locker/management">Thiết lập tủ</Link>
                </Menu.Item>
                <Menu.Item key="locker-sizes" icon={<DollarOutlined />}>
                  <Link to="/locker/size-price">Thiết lập kích cỡ & giá</Link>
                </Menu.Item>
                <Menu.Item key="locker-compartments" icon={<PartitionOutlined />}>
                  <Link to="/locker/compartments">Thiết lập ngăn tủ</Link>
                </Menu.Item>
                <Menu.Item key="locker-locations" icon={<EnvironmentOutlined />}>
                  <Link to="/locker/locations">Thiết lập vị trí</Link>
                </Menu.Item>
              </Menu.SubMenu>
            )}
          {isAdmin && (
              <Menu.SubMenu key="users" icon={<UserOutlined />} title="Khách hàng">
                <Menu.Item key="user-management" icon={<SettingOutlined />}>
                  <Link to="/users/management">Thiết lập người dùng</Link>
                </Menu.Item>
                <Menu.Item key="user-permissions" icon={<SolutionOutlined />}>
                  <Link to="/users/permissions">Quản lý khách hàng</Link>
                </Menu.Item>
              </Menu.SubMenu>
            )}
            
          </Menu>
        </Sider>
        
        <Layout>
          <Header style={{ 
            background: '#fff', 
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}>
            
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>               
              <Dropdown 
                menu={{ 
                  items: userMenuItems,
                  onClick: ({ key }) => this.handleMenuClick(key)
                }} 
                trigger={['click']}
              >
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                  <span>{userInfo?.name || 'Username'}</span>
                  <DownOutlined style={{ marginLeft: 4 }} />
                </div>
              </Dropdown>
            </div>
          </Header>
          
          <Content style={{ 
            margin: '24px 16px', 
            padding: 24, 
            background: '#fff',
            borderRadius: 8
          }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    );
  }
}

// Wrapper to use hooks
function MainLayout() {
  return <MainLayoutComponent />;
}

export default MainLayout;








