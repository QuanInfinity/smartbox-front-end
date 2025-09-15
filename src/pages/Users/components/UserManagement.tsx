import { Component, type ReactNode } from 'react';
import { Table, Button, Space, Tag, Modal, message, Form, Input, Select, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined,  EyeOutlined } from '@ant-design/icons';
import { userService, type User } from '../../../services/userService';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface UserManagementState {
  loading: boolean;
  data: User[];
  isModalVisible: boolean;
  isViewModalVisible: boolean;
  editingUser: User | null;
  viewingUser: User | null;
  isDeleteModalVisible: boolean;
  deletingUser: User | null;
}

class UserManagement extends Component<{}, UserManagementState> {
  state: UserManagementState = {
    loading: false,
    data: [],
    isModalVisible: false,
    isViewModalVisible: false,
    editingUser: null,
    viewingUser: null,
    isDeleteModalVisible: false,
    deletingUser: null,
  };

  componentDidMount() {
    this.loadUsers();
  }

  loadUsers = async () => {
    this.setState({ loading: true });
    try {
      const users = await userService.getAllUsers();
      this.setState({ data: users });
    } catch (error) {
      message.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  showModal = () => {
    this.setState({ isModalVisible: true, editingUser: null });
  };

  showEditModal = (user: User) => {
    this.setState({ isModalVisible: true, editingUser: user });
  };

  showViewModal = (user: User) => {
    this.setState({ isViewModalVisible: true, viewingUser: user });
  };

  handleCancel = () => {
    this.setState({ isModalVisible: false, editingUser: null });
  };

  handleViewCancel = () => {
    this.setState({ isViewModalVisible: false, viewingUser: null });
  };

  handleSubmit = async (values: any) => {
    const { editingUser } = this.state;
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, values);
        message.success('User updated successfully!');
        console.log(values);
      } else {
        await userService.createUser(values);
        message.success('User created successfully!');
        console.log()
      }
      this.setState({ isModalVisible: false, editingUser: null });
      this.loadUsers();
    } catch (error:any) {
      message.error('Failed to save user');
      console.error('Error saving user:', error);
      console.error('API Error Response:', error.response.data);
    }
  };

  handleDelete = (user: User) => {
    this.setState({ isDeleteModalVisible: true, deletingUser: user });
  };

  handleDeleteConfirm = async () => {
    const { deletingUser } = this.state;
    if (deletingUser) {
      try {
        await userService.deleteUser(deletingUser.id);
        message.success('User deleted successfully!');
        this.loadUsers();
      } catch (error) {
        message.error('Failed to delete user');
        console.error('Error deleting user:', error);
      }
    }
    this.setState({ isDeleteModalVisible: false, deletingUser: null });
  };

  handleDeleteCancel = () => {
    this.setState({ isDeleteModalVisible: false, deletingUser: null });
  };

  columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'right',
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      align: 'right',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role_id',
      key: 'role_id',
      width: 100,
      render: (role_id: number) => (
        <Tag color={role_id === 1 ? 'red' : role_id === 2 ? 'orange' : 'blue'}>
          {role_id === 1 ? 'Quản trị viên' : role_id === 2 ? 'Nhân viên kỹ thuật' : 'Khách hàng'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      align: 'center',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (user: User) => (
        <Space size="small">
          <Tooltip title="Xem Chi Tiết">
            <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => this.showViewModal(user)} />
          </Tooltip>
          <Tooltip title="Chỉnh Sửa Người Dùng">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => this.showEditModal(user)} />
          </Tooltip>
          <Tooltip title="Xóa Người Dùng">
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => this.handleDelete(user)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  render(): ReactNode {
    const { loading, data, isModalVisible, isViewModalVisible, editingUser, viewingUser, isDeleteModalVisible, deletingUser } = this.state;

    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h1>Thiết Lập Người Dùng</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={this.showModal} style={{ backgroundColor: '#52c41a' }}>
            Thêm người dùng
          </Button>
        </div>
        
        <Table 
          columns={this.columns} 
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 940 }}
          size="middle"
        />

        {/* Add/Edit Modal */}
        <Modal
          title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
          open={isModalVisible}
          onCancel={this.handleCancel}
          footer={null}
          width={600}
        >
          <Form
            layout="vertical"
            onFinish={this.handleSubmit}
            initialValues={editingUser ? {
              name: editingUser.name,
              phone: editingUser.phone,
              email: editingUser.email,
              // Không set password khi edit để giữ nguyên password cũ
              role_id: editingUser.role_id,
              status: editingUser.status,
            } : {}}
          >
            <Form.Item
              label="Tên"
              name="name"
              rules={[{ required: true, message: 'Hãy nhập tên người dùng!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Hãy nhập số điện thoại!' },
                { pattern: /^[0-9]{10,11}$/, message: 'Hãy nhập số điện thoại hợp lệ!' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Hãy nhập email!' },
                { type: 'email', message: 'Hãy nhập email hợp lệ!' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: !editingUser, message: 'Hãy nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password placeholder={editingUser ? "Bỏ trống để giữ lại mật khẩu cũ" : "Nhập mật khẩu"} />
            </Form.Item>

            <Form.Item
              label="Vai trò"
              name="role_id"
              rules={[{ required: true, message: 'Hãy chọn vai trò!' }]}
            >
              <Select>
                <Option value={1}>Quản trị viên</Option>
                <Option value={2}>Nhân viên kỹ thuật</Option>
                <Option value={3}>Khách hàng</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
            >
              <Select>
                <Option value={1}>Hoạt động</Option>
                <Option value={0}>Không hoạt động</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingUser ? 'Cập nhật' : 'Thêm'}
                </Button>
                <Button onClick={this.handleCancel}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* View Modal */}
        <Modal
          title="Chi tiết người dùng"
          open={isViewModalVisible}
          onCancel={this.handleViewCancel}
          footer={[
            <Button key="close" onClick={this.handleViewCancel}>
                Đóng
            </Button>
          ]}
          width={500}
        >
          {viewingUser && (
            <div>
              <p><strong>ID:</strong> {viewingUser.id}</p>
              <p><strong>Tên:</strong> {viewingUser.name}</p>
              <p><strong>Số điện thoại:</strong> {viewingUser.phone}</p>
              <p><strong>Email:</strong> {viewingUser.email}</p>
              <p><strong>Vai trò:</strong> <Tag color={viewingUser.role_id === 1 ? 'red' : viewingUser.role_id === 2 ?'orange':'blue'}>{viewingUser.role_id === 1 ? 'Quản trị viên' : viewingUser.role_id === 2 ? 'Nhân viên kỹ thuật' : 'Khách hàng'}</Tag></p>
              <p><strong>Trạng thái:</strong> <Tag color={viewingUser.status === 1 ? 'green' : 'red'}>{viewingUser.status === 1 ? 'Hoạt động' : 'Không hoạt động'}</Tag></p>
              <p><strong>Thời gian tạo:</strong> {viewingUser.createTime}</p>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Confirm Delete"
          open={isDeleteModalVisible}
          onOk={this.handleDeleteConfirm}
          onCancel={this.handleDeleteCancel}
          okText="Yes, Delete"
          cancelText="Cancel"
          okType="danger"
        >
          {deletingUser && (
            <p>Are you sure you want to delete user <strong>"{deletingUser.name}"</strong>?</p>
          )}
        </Modal>
      </div>
    );
  }
}

export default UserManagement;




























