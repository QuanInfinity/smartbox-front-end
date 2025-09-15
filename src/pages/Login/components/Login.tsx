import { Component, type ReactNode } from 'react';
import { Form, Input, Button, Checkbox, Card, Avatar, Space, Flex, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { authService } from '../../../services/authService';

interface LoginFormValues {
  email: string;
  password: string;
  showPassword: boolean;
}

interface LoginState {
  loading: boolean;
}

class Login extends Component<{}, LoginState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      loading: false
    };
  }

  handleSubmit = async (values: LoginFormValues) => {
    this.setState({ loading: true });
    
    try {
      const response = await authService.login({
        email: values.email,
        password: values.password
      });
      
      if (response.access_token) {
        message.success('Đăng nhập thành công!');
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      message.error(error.message || 'Đăng nhập thất bại');
    } finally {
      this.setState({ loading: false });
    }
  };

  render(): ReactNode {
    // Nếu đã đăng nhập, redirect đến dashboard
    if (localStorage.getItem('token')) {
      return <Navigate to="/dashboard" replace />;
    }

    const { loading } = this.state;

    return (
      <Flex 
        justify="center" 
        align="center" 
        style={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(63deg, #e2edf7ff 0%, #00a0f7ff 100%)' 
        }}
      >
        <Card 
          style={{ 
            width: 400, 
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 50,
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Flex vertical align="center" gap="middle">
              <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#8c8c8c' }} />
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Đăng nhập</h2>
            </Flex>
            
            <Form
              name="login"
              onFinish={this.handleSubmit}
              layout="vertical"
              style={{ width: '100%' }}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password size="large" />
              </Form.Item>

              <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Form.Item name="showPassword" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>Xem mật khẩu</Checkbox>
                </Form.Item>
                <Button type="link" style={{ padding: 0 }}>
                  Quên mật khẩu?
                </Button>
              </Flex>
              
              <Flex justify="center" align="center" style={{ marginBottom: 24 }}>
                <Form.Item style={{ margin: 0 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large"
                    loading={loading}
                    style={{ height: 44, fontSize: 16, width: '150px' }}
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>
                </Form.Item>
              </Flex>
            </Form>
          </Space>
        </Card>
      </Flex>
    );
  }
}

export default Login;










