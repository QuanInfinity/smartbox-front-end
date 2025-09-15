import { Component, type ReactNode } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, InputNumber, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import lockerService, { type SizeData } from '../../../services/lockerService';
import type { ColumnsType } from 'antd/es/table';

interface SizeState {
  loading: boolean;
  data: SizeData[];
  isModalVisible: boolean;
  isDeleteModalVisible: boolean;
  isViewModalVisible: boolean;
  isErrorModalVisible: boolean;
  editingSize: SizeData | null;
  deletingSize: SizeData | null;
  viewingSize: SizeData | null;
  errorMessage: string;
}

class LockerSizes extends Component<{}, SizeState> {
  state: SizeState = {
    loading: false,
    data: [],
    isModalVisible: false,
    isDeleteModalVisible: false,
    isViewModalVisible: false,
    isErrorModalVisible: false,
    editingSize: null,
    deletingSize: null,
    viewingSize: null,
    errorMessage: '',
  };

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      const data = await lockerService.getSizes();
      console.log('Loaded sizes data:', data); // ✅ Debug log
      this.setState({ data });
    } catch (error) {
      message.error('Failed to load sizes');
      console.error('Load sizes error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  showModal = () => {
    this.setState({ isModalVisible: true, editingSize: null });
  };

  handleEdit = (size: SizeData) => {
    console.log('Editing size - raw data:', size); // ✅ Debug log
    console.log('Size fields:', {
      name: size.name,
      width_cm: size.width_cm,
      height_cm: size.height_cm,
      depth_cm: size.depth_cm,
      price_per_hour: size.price_per_hour
    }); // ✅ Debug individual fields
    
    this.setState({ 
      isModalVisible: true, 
      editingSize: size
    });
  };

  handleDelete = (size: SizeData) => {
    this.setState({ isDeleteModalVisible: true, deletingSize: size });
  };

  handleSubmit = async (values: any) => {
    const { editingSize } = this.state;
    this.setState({ loading: true });
    
    console.log('Form values:', values); // ✅ Debug log
    
    try {
      const sizeData = {
        name: values.name,
        price_per_hour: parseFloat(values.price_per_hour),
        width_cm: values.width_cm,
        height_cm: values.height_cm,
        depth_cm: values.depth_cm,
      };

      console.log('Sending size data:', sizeData); // ✅ Debug log

      if (editingSize) {
        await lockerService.updateSize(editingSize.size_id, sizeData);
        message.success('Size updated successfully!');
      } else {
        await lockerService.createSize(sizeData);
        message.success('Size created successfully!');
      }
      
      this.setState({ isModalVisible: false, editingSize: null });
      await this.loadData();
    } catch (error: any) {
      console.error('Submit error:', error); // ✅ Debug log
      
      // Xử lý lỗi tên kích thước trùng lặp
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || 'Tên kích thước đã tồn tại';
        this.setState({ 
          isErrorModalVisible: true, 
          errorMessage: errorMessage 
        });
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        message.error(`Failed to ${editingSize ? 'update' : 'create'} size: ${errorMessage}`);
      }
    } finally {
      this.setState({ loading: false });
    }
  };

  handleDeleteConfirm = async () => {
    const { deletingSize } = this.state;
    if (!deletingSize) return;

    this.setState({ loading: true });
    try {
      await lockerService.deleteSize(deletingSize.size_id); // ✅ Pass number directly
      message.success('Size deleted successfully!');
      this.setState({ isDeleteModalVisible: false, deletingSize: null });
      await this.loadData();
    } catch (error) {
      message.error('Failed to delete size');
      console.error('Delete size error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  handleCancel = () => {
    this.setState({ 
      isModalVisible: false, 
      editingSize: null // ✅ Clear editing size
    });
  };

  handleDeleteCancel = () => {
    this.setState({ isDeleteModalVisible: false, deletingSize: null });
  };

  handleErrorModalClose = () => {
    this.setState({ isErrorModalVisible: false, errorMessage: '' });
  };

  showViewModal = (size: SizeData) => {
    this.setState({ 
      isViewModalVisible: true, 
      viewingSize: size 
    });
  };

  handleViewCancel = () => {
    this.setState({ 
      isViewModalVisible: false, 
      viewingSize: null 
    });
  };

  columns: ColumnsType<SizeData> = [
    {
      title: 'Tên kích thước',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: 'Kích thước (rộng × cao × sâu cm)',
      key: 'dimensions',
      width: 220,
      render: (record: SizeData) => (
        <span>{record.width_cm} × {record.height_cm} × {record.depth_cm}</span>
      ),
      align: 'right',
    },
    {
      title: 'Giá/giờ (VND)',
      dataIndex: 'price_per_hour',
      key: 'price_per_hour',
      width: 150,
      render: (price: number) => Math.round(price).toLocaleString('vi-VN'),
      align: 'right',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (record: SizeData) => (
        <Space size="small">
          <Tooltip title="Xem Chi Tiết">
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => this.showViewModal(record)}
              disabled={this.state.loading}
            />
          </Tooltip>
          <Tooltip title="Chỉnh Sửa Kích Thước">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => this.handleEdit(record)}
              disabled={this.state.loading}
            />
          </Tooltip>
          <Tooltip title="Xóa Kích Thước">
            <Button 
              type="primary" 
              danger 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={() => this.handleDelete(record)}
              disabled={this.state.loading}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  render(): ReactNode {
    const { loading, data, isModalVisible, isDeleteModalVisible, isViewModalVisible, isErrorModalVisible, editingSize, deletingSize, viewingSize, errorMessage } = this.state;

    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h1 style={{ margin: 0 }}>Thiết Lập Kích Thước và Giá</h1>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ backgroundColor: '#52c41a' }} 
            onClick={this.showModal}
            disabled={loading}
          >
            Thêm kích thước
          </Button>
        </div>
        
        <Table 
          columns={this.columns} 
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          size="middle"
        />

        {/* Add/Edit Modal */}
        <Modal
          title={editingSize ? 'Chỉnh sửa' : 'Thêm'}
          open={isModalVisible}
          onCancel={this.handleCancel}
          footer={null}
          width={600}
          confirmLoading={loading}
          destroyOnClose={true} // ✅ Reset form when modal closes
        >
          <Form
            layout="vertical"
            onFinish={this.handleSubmit}
            initialValues={editingSize ? {
              name: editingSize.name,
              width_cm: editingSize.width_cm,
              height_cm: editingSize.height_cm,
              depth_cm: editingSize.depth_cm,
              price_per_hour: editingSize.price_per_hour,
            } : {}}
            key={editingSize ? editingSize.size_id : 'new'} // ✅ Force re-render
          >
            <Form.Item
              label="Tên Kích Thước"
              name="name" // ✅ Change from size_name to name
              rules={[{ required: true, message: 'Vui lòng nhập tên kích thước!' }]}
            >
              <Input placeholder="VD: Small, Medium, Large" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item
                label="Chiều Rộng (cm)"
                name="width_cm"
                rules={[{ required: true, message: 'Please input width!' }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Chiều Cao (cm)"
                name="height_cm"
                rules={[{ required: true, message: 'Please input height!' }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Chiều Sâu (cm)"
                name="depth_cm"
                rules={[{ required: true, message: 'Please input depth!' }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item
              label="Giá/Giờ (VND)"
              name="price_per_hour"
              rules={[{ required: true, message: 'Please input price per hour!' }]}
            >
              <InputNumber 
                placeholder="VD: 10000"
                min={1000}
                step={1000}
                precision={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={this.handleCancel}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingSize ? 'Cập nhật' : 'Thêm'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title="Xác nhận xóa"
          open={isDeleteModalVisible}
          onOk={this.handleDeleteConfirm}
          onCancel={this.handleDeleteCancel}
          okText="Xóa"
          cancelText="Hủy"
          okType="danger"
          confirmLoading={loading}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 22 }} />
            <div>
              {deletingSize && (
                <p style={{ margin: 0 }}>
                  Bạn có chắc chắn muốn xóa kích thước <strong>"{deletingSize.name}"</strong>?
                  <br />
                  <small style={{ color: '#666' }}>Hành động này không thể hoàn tác.</small>
                </p>
              )}
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal
          title="Chi tiết kích thước"
          open={isViewModalVisible}
          onCancel={this.handleViewCancel}
          footer={[
            <Button key="close" onClick={this.handleViewCancel}>
              Đóng
            </Button>
          ]}
          width={600}
        >
          {viewingSize && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <strong>Tên Kích Thước:</strong> {viewingSize.name}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Kích Thước:</strong> {viewingSize.width_cm} × {viewingSize.height_cm} × {viewingSize.depth_cm} cm
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Giá/Giờ:</strong> {viewingSize.price_per_hour.toLocaleString('vi-VN')} VND
              </div>
            </div>
          )}
        </Modal>

        {/* Error Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
              <span>Lỗi xác thực</span>
            </div>
          }
          open={isErrorModalVisible}
          onCancel={this.handleErrorModalClose}
          footer={[
            <Button key="ok" type="primary" onClick={this.handleErrorModalClose}>
              Đã hiểu
            </Button>
          ]}
          width={500}
          centered
        >
          <div style={{ padding: '16px 0' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 12,
              padding: '16px',
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20, marginTop: 2 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: '#ff4d4f' }}>
                  Không thể lưu kích thước
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                  {errorMessage}
                </p>
              </div>
            </div>
            <div style={{ 
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#52c41a' }}>
                💡 <strong>Gợi ý:</strong> Vui lòng thay đổi tên kích thước thành một tên khác để tiếp tục.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default LockerSizes;






















































