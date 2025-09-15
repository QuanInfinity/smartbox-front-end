import { Component, type ReactNode } from 'react';
import { Table, Button, Space, Tag, message, Modal, Form, Input, Select, Tooltip, Flex } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import lockerService, { type CompartmentData, type SizeData, type LockerData } from '../../../services/lockerService';

interface CompartmentState {
  loading: boolean;
  data: CompartmentData[];
  sizes: SizeData[];
  lockers: LockerData[];
  isModalVisible: boolean;
  isDeleteModalVisible: boolean;
  isViewModalVisible: boolean;
  editingCompartment: CompartmentData | null;
  deletingCompartment: CompartmentData | null;
  viewingCompartment: CompartmentData | null;
  filteredData: CompartmentData[];
  statusFilter: number | undefined;
}

// const filterConfig = [
//   { name: 'locker', label: 'Tên Tủ Khóa', type: 'text', placeholder: 'Tìm kiếm tên tủ khóa...' },
//   { name: 'location', label: 'Vị Trí', type: 'text', placeholder: 'Tìm kiếm vị trí...' },
//   { name: 'size', label: 'Kích Thước', type: 'text', placeholder: 'Tìm kiếm kích thước...' },
//   { name: 'status', label: 'Trạng Thái', type: 'select', options: [
//     { label: 'Có Sẵn', value: 1 }, 
//     { label: 'Đã Thuê', value: 0 }, 
//     { label: 'Bảo Trì', value: 2 }
//   ]},
// ];

class LockerCompartments extends Component<{}, CompartmentState> {
  state: CompartmentState = {
    loading: false,
    data: [],
    sizes: [],
    lockers: [],
    isModalVisible: false,
    isDeleteModalVisible: false,
    isViewModalVisible: false,
    editingCompartment: null,
    deletingCompartment: null,
    viewingCompartment: null,
    filteredData: [],
    statusFilter: undefined,
  };


  handleStatusFilterChange = (value: number | undefined) => {
    this.setState({ statusFilter: value });
    this.filterData(value);
  };

  filterData = (statusFilter: number | undefined) => {
    const { data } = this.state;
    if (statusFilter === undefined) {
      this.setState({ filteredData: [] });
    } else {
      const filtered = data.filter(item => item.status === statusFilter);
      this.setState({ filteredData: filtered });
    }
  };

  componentDidMount() {
    this.loadData();
    this.loadSizes();
    this.loadLockers();
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      const data = await lockerService.getCompartments();
      this.setState({ data: data.map(item => ({ ...item, key: item.compartment_id.toString() })) });
    } catch (error) {
      message.error('Failed to load compartments');
      console.error('Load compartments error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  loadLockers = async () => {
    try {
      const lockers = await lockerService.getLockers();
      this.setState({ lockers });
    } catch (error) {
      console.error('Load lockers error:', error);
    }
  };

  loadSizes = async () => {
    try {
      const sizes = await lockerService.getSizes();
      this.setState({ sizes });
    } catch (error) {
      console.error('Load sizes error:', error);
    }
  };

  showModal = () => {
    this.setState({ isModalVisible: true, editingCompartment: null });
  };

  handleEdit = (compartment: CompartmentData) => {
    this.setState({ 
      isModalVisible: true, 
      editingCompartment: compartment
    });
  };

  handleDelete = (compartment: CompartmentData) => {
    this.setState({ 
      isDeleteModalVisible: true, 
      deletingCompartment: compartment 
    });
  };

  showViewModal = (compartment: CompartmentData) => {
    this.setState({ 
      isViewModalVisible: true, 
      viewingCompartment: compartment 
    });
  };

  handleViewCancel = () => {
    this.setState({ 
      isViewModalVisible: false, 
      viewingCompartment: null 
    });
  };

  handleSubmit = async (values: any) => {
    const { editingCompartment } = this.state;
    this.setState({ loading: true });
    
    try {
      const compartmentData = {
        code: values.code,
        locker_id: values.locker_id.toString(), // ✅ Ensure string for backend
        size_id: values.size_id,
        status: values.status, // ✅ Direct use - already number
      };

      if (editingCompartment) {
        await lockerService.updateCompartment(editingCompartment.compartment_id, compartmentData);
        message.success('Compartment updated successfully!');
      } else {
        await lockerService.createCompartment(compartmentData);
        message.success('Compartment created successfully!');
      }
      
      this.setState({ isModalVisible: false, editingCompartment: null });
      await this.loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      message.error(`Failed to ${editingCompartment ? 'update' : 'create'} compartment: ${errorMessage}`);
      console.error('Submit error:', error); // ✅ Add debug log
    } finally {
      this.setState({ loading: false });
    }
  };

  handleDeleteConfirm = async () => {
    const { deletingCompartment } = this.state;
    if (!deletingCompartment) return;

    this.setState({ loading: true });
    try {
      await lockerService.deleteCompartment(deletingCompartment.compartment_id);
      message.success('Ngăn tủ đã xóa thành công!');
      this.setState({ isDeleteModalVisible: false, deletingCompartment: null });
      await this.loadData();
    } catch (error) {
      message.error('Failed to delete compartment' + error);
      console.error('Delete compartment error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  handleCancel = () => {
    this.setState({ isModalVisible: false, editingCompartment: null });
  };

  handleDeleteCancel = () => {
    this.setState({ isDeleteModalVisible: false, deletingCompartment: null });
  };

  columns = [
    {
      title: 'Mã ngăn',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Tủ khóa',
      key: 'locker',
      width: 120,
      render: (record: CompartmentData) => record.locker?.code || 'N/A',
    },
    {
      title: 'Vị trí',
      key: 'location',
      width: 150,
      render: (record: CompartmentData) => record.locker?.location?.name || 'N/A',
    },
    {
      title: 'Kích thước',
      key: 'size',
      width: 120,
      render: (record: CompartmentData) => record.size?.name || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number) => {
        const statusConfig = {
          1: { text: 'Có sẵn', color: 'green' },
          0: { text: 'Đã thuê', color: 'blue' },
          2: { text: 'Bảo trì', color: 'orange' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { text: 'Không xác định', color: 'gray' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (record: CompartmentData) => (
        <Space size="small">
          <Tooltip title="Xem Chi Tiết">
            <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => this.showViewModal(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh Sửa Ngăn">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => this.handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Xóa Ngăn">
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => this.handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];


  render(): ReactNode {
    const { loading, data, filteredData, isModalVisible, isDeleteModalVisible, isViewModalVisible, editingCompartment, deletingCompartment, viewingCompartment, lockers, sizes } = this.state;

    return (
      <div>
        <h1 style={{ margin: 10 }}>Thiết Lập Ngăn Tủ</h1>
       
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <div>
            
            <Select
              placeholder="Chọn trạng thái"
              style={{ width: 150 }}
              value={this.state.statusFilter}
              onChange={this.handleStatusFilterChange}
              allowClear
            >
              <Select.Option value={1}>Có sẵn</Select.Option>
              <Select.Option value={0}>Đã thuê</Select.Option>
              <Select.Option value={2}>Bảo trì</Select.Option>
            </Select>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={this.showModal} style={{ backgroundColor: '#52c41a' }}>
            Thêm ngăn tủ
          </Button>
        </Flex>
        <Table 
          columns={this.columns} 
          dataSource={filteredData.length > 0 ? filteredData : data}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="middle"
        />

        {/* Add/Edit Modal */}
        <Modal
          title={editingCompartment ? 'Chỉnh sửa ngăn tủ' : 'Thêm ngăn tủ'}
          open={isModalVisible}
          onCancel={this.handleCancel}
          footer={null}
          width={600}
          destroyOnClose={true}
        >
          <Form
            layout="vertical"
            onFinish={this.handleSubmit}
            initialValues={editingCompartment ? {
              code: editingCompartment.code, // ✅ Đã sửa
              locker_id: editingCompartment.locker_id,
              size_id: editingCompartment.size_id,
              status: editingCompartment.status,
            } : {
              status: 1 // ✅ Đã sửa: dùng number
            }}
            key={editingCompartment ? editingCompartment.compartment_id : 'new'}
          >
            <Form.Item label="Mã ngăn" name="code" rules={[{ required: true, message: 'Vui lòng nhập mã ngăn!' }]}>
              <Input placeholder="VD: C01, C02" />
            </Form.Item>

            <Form.Item label="Tủ khóa" name="locker_id" rules={[{ required: true, message: 'Vui lòng chọn tủ khóa!' }]}>
              <Select placeholder="Chọn tủ khóa" loading={lockers.length === 0}>
                {lockers.map(locker => (
                  <Select.Option key={locker.locker_id} value={locker.locker_id}>
                    {locker.code} - {locker.location?.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Kích thước" name="size_id" rules={[{ required: true, message: 'Vui lòng chọn kích thước!' }]}>
              <Select placeholder="Chọn kích thước">
                {sizes.map(size => (
                  <Select.Option key={size.size_id} value={size.size_id}>
                    {size.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}>
              <Select>
                <Select.Option value={1}>Có sẵn</Select.Option>
                <Select.Option value={0}>Đã thuê</Select.Option>
                <Select.Option value={2}>Bảo trì</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={this.handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingCompartment ? 'Cập nhật' : 'Thêm'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Xác nhận xóa"
          open={isDeleteModalVisible}
          onOk={this.handleDeleteConfirm}
          onCancel={this.handleDeleteCancel}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 22, marginRight: 16 }} />
            <div>
              <p style={{ margin: 0 }}>Bạn có chắc chắn muốn xóa ngăn tủ này?</p>
              {deletingCompartment && (
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                  <strong>Mã ngăn:</strong> {deletingCompartment.code}
                </p>
              )}
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal
          title="Chi tiết ngăn tủ"
          open={isViewModalVisible}
          onCancel={this.handleViewCancel}
          footer={[
            <Button key="close" onClick={this.handleViewCancel}>
              Đóng
            </Button>
          ]}
          width={600}
        >
          {viewingCompartment && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <strong>Mã ngăn:</strong> {viewingCompartment.code}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Tủ khóa:</strong> {viewingCompartment.locker?.code || 'N/A'}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Vị trí:</strong> {viewingCompartment.locker?.location?.name || 'N/A'}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Kích thước:</strong> {viewingCompartment.size?.name || 'N/A'}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Trạng thái:</strong>{' '}
                <Tag color={viewingCompartment.status === 1 ? 'green' : viewingCompartment.status === 0 ? 'blue' : 'orange'}>
                  {viewingCompartment.status === 1 ? 'Có sẵn' : viewingCompartment.status === 0 ? 'Đã thuê' : 'Bảo trì'}
                </Tag>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

export default LockerCompartments;






























