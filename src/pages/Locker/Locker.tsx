import { Component, type ReactNode } from 'react';
import { Table, Button, Space, Tag, Modal, message, Form, Input, Select, Tooltip, InputNumber, Divider, Flex } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EyeOutlined, } from '@ant-design/icons';
import lockerService, { type LockerData, type LocationData, type SizeData } from '../../services/lockerService';
import addressService, { type Province, type District, type Ward } from '../../services/addressService';

import type { ColumnsType } from 'antd/es/table';



interface LockerState {
  loading: boolean;
  data: LockerData[];
  sizes: SizeData[];
  locations: LocationData[];
  isModalVisible: boolean;
  isDeleteModalVisible: boolean;
  isViewModalVisible: boolean;
  isLocationModalVisible: boolean;
  editingLocker: LockerData | null;
  deletingLocker: LockerData | null;
  viewingLocker: LockerData | null;
  locationSearchValue: string;
  // Add address fields
  provinces: Province[];
  districts: District[];
  wards: Ward[];
  selectedProvince: number | null;
  selectedDistrict: number | null;
  selectedWard: number | null;
  loadingProvinces: boolean;
  loadingDistricts: boolean;
  loadingWards: boolean;
  filteredData: LockerData[];
}

class Locker extends Component<{}, LockerState> {
  state: LockerState = {
    loading: false,
    data: [],
    sizes: [],
    locations: [],
    isModalVisible: false,
    isDeleteModalVisible: false,
    isViewModalVisible: false,
    isLocationModalVisible: false,
    editingLocker: null,
    deletingLocker: null,
    viewingLocker: null,
    locationSearchValue: '',
    // Add address fields
    provinces: [],
    districts: [],
    wards: [],
    selectedProvince: null,
    selectedDistrict: null,
    selectedWard: null,
    loadingProvinces: false,
    loadingDistricts: false,
    loadingWards: false,
    filteredData: [],
  };

  async componentDidMount() {
    await Promise.all([
      this.loadData(),
      this.loadSizes(),
      this.loadLocations(),
      this.loadProvinces(),
    ]);
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      const data = await lockerService.getLockers();
      this.setState({ data: data.map(item => ({ ...item, key: item.locker_id })) });
    } catch (error) {
      message.error('Failed to load lockers');
      console.error('Load lockers error:', error);
      // Fallback to mock data
      
      
    } finally {
      this.setState({ loading: false });
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

  loadLocations = async () => {
    try {
      const locations = await lockerService.getLocations();
      this.setState({ locations });
    } catch (error) {
      console.error('Load locations error:', error);
    }
  };

  // Add address methods
  loadProvinces = async () => {
    this.setState({ loadingProvinces: true });
    try {
      const provinces = await addressService.getProvinces();
      this.setState({ provinces });
    } catch (error) {
      console.error('Failed to load provinces:', error);
    } finally {
      this.setState({ loadingProvinces: false });
    }
  };

  onProvinceChange = async (ProvinceId: number) => {
    this.setState({ 
      selectedProvince: ProvinceId, 
      selectedDistrict: null,
      selectedWard: null,
      districts: [],
      wards: [],
      loadingDistricts: true 
    });
    
    try {
      const districts = await addressService.getDistrictsByProvince(ProvinceId);
      this.setState({ districts });
    } catch (error) {
      console.error('Failed to load districts:', error);
    } finally {
      this.setState({ loadingDistricts: false });
    }
  };

  onDistrictChange = async (DistrictId: number) => {
    this.setState({ 
      selectedDistrict: DistrictId,
      selectedWard: null,
      wards: [],
      loadingWards: true 
    });
    
    try {
      const wards = await addressService.getWardsByDistrict(DistrictId);
      this.setState({ wards });
    } catch (error) {
      console.error('Failed to load wards:', error);
    } finally {
      this.setState({ loadingWards: false });
    }
  };

  onWardChange = (WardId: number) => {
    this.setState({ selectedWard: WardId });
  };

  showModal = () => {
    this.setState({ isModalVisible: true, editingLocker: null });
  };

  handleEdit = (locker: LockerData) => {
    this.setState({ isModalVisible: true, editingLocker: locker });
  };

  handleDelete = (locker: LockerData) => {
    this.setState({ isDeleteModalVisible: true, deletingLocker: locker });
  };

  handleSubmit = async (values: any) => {
    this.setState({ loading: true });
    try {
      console.log('Form values received:', values);
      console.log('Raw compartments:', values.compartments);
      console.log('Available sizes:', this.state.sizes);
      
      // Convert compartments object to proper format
      const compartmentsObject: { [key: string]: number } = {};
      if (values.compartments && typeof values.compartments === 'object') {
        Object.entries(values.compartments).forEach(([sizeId, quantity]) => {
          console.log(`Processing size ${sizeId} with quantity ${quantity}`);
          if (quantity && Number(quantity) > 0) {
            compartmentsObject[sizeId] = Number(quantity);
          }
        });
      }
      
      console.log('Final compartments object:', compartmentsObject);
      
      const lockerData = {
        code: values.code,
        location_id: parseInt(values.location_id),
        status: values.status,
        compartments: compartmentsObject
      };
      
      console.log('Sending locker data:', lockerData);

      if (this.state.editingLocker) {
        await lockerService.updateLocker(this.state.editingLocker.locker_id, lockerData);
        message.success('Locker updated successfully!');
      } else {
        await lockerService.createLocker(lockerData);
        message.success('Locker created successfully!');
      }

      this.setState({ isModalVisible: false, editingLocker: null });
      await this.loadData();
    } catch (error) {
      console.error('Save locker error:', error);
      message.error('Failed to save locker');
    } finally {
      this.setState({ loading: false });
    }
  };

  handleDeleteConfirm = async () => {
    const { deletingLocker } = this.state;
    if (!deletingLocker) return;

    this.setState({ loading: true });
    try {
      await lockerService.deleteLocker(deletingLocker.locker_id);
      message.success('Locker deleted successfully!');
      this.setState({ isDeleteModalVisible: false, deletingLocker: null });
      await this.loadData();
    } catch (error) {
      message.error('Failed to delete locker');
      console.error('Delete locker error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  handleCancel = () => {
    this.setState({ isModalVisible: false, editingLocker: null });
  };

  handleDeleteCancel = () => {
    this.setState({ isDeleteModalVisible: false, deletingLocker: null });
  };

  showViewModal = (locker: LockerData) => {
    this.setState({ 
      isViewModalVisible: true, 
      viewingLocker: locker 
    });
  };

  handleViewCancel = () => {
    this.setState({ 
      isViewModalVisible: false, 
      viewingLocker: null 
    });
  };

  showLocationModal = () => {
    this.setState({ isLocationModalVisible: true });
    this.loadProvinces();
  };

  handleLocationCancel = () => {
    this.setState({ 
      isLocationModalVisible: false,
      selectedProvince: null,
      selectedDistrict: null,
      provinces: [],
      districts: [],
      wards: []
    });
  };

  handleLocationSubmit = async (values: any) => {
    console.log('📝 Location form values:', values);
    this.setState({ loading: true });
    try {
      // Validate required fields
      if (!values.name || !values.address) {
        message.error('Vui lòng điền đầy đủ tên và địa chỉ!');
        return;
      }

      const locationData = {
        name: values.name,
        address: values.address,
        ProvinceId: values.ProvinceId || null,
        DistrictId: values.DistrictId || null,
        WardId: values.WardId || null,
        latitude: values.latitude ? parseFloat(values.latitude.toString()) : 0,
        longitude: values.longitude ? parseFloat(values.longitude.toString()) : 0,
        multiplier: values.multiplier || 1.0,
        area_description: values.area_description || '',
      };

      console.log('📤 Sending location data:', locationData);
      await lockerService.createLocation(locationData);
      message.success('Location created successfully!');
      
      this.setState({ isLocationModalVisible: false });
      await this.loadLocations();
    } catch (error: any) {
      console.error('❌ Create location error:', error);
      message.error(`Failed to create location: ${error.response?.data?.message || error.message}`);
    } finally {
      this.setState({ loading: false });
    }
  };

  onLocationSearch = (value: string) => {
    this.setState({ locationSearchValue: value });
  };

  handleFilteredDataChange = (filteredData: LockerData[]) => {
    // Update state with filtered data or use it directly in render
    this.setState({ filteredData });
  };



  render(): ReactNode {
    const { loading, data, filteredData, isModalVisible, isDeleteModalVisible, isViewModalVisible, isLocationModalVisible, editingLocker, deletingLocker, viewingLocker, locations, sizes } = this.state;
    const columns: ColumnsType<LockerData>= [
    {
      title: "Mã Tủ Khóa",
      dataIndex: "locker_id",
      key: "locker_id",
      width: 60,
      align : "right",   
    },
    {
      title: "Mã Code",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Vị Trí",
      dataIndex: "location",
      key: "location",
      width: 200,
      render: (location: any) => location?.name || "N/A",
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: number) => {
        const statusMap = {
          1: { text: "Hoạt Động", color: "green" },
          0: { text: "Không Hoạt Động", color: "red" },
          2: { text: "Bảo Trì", color: "orange" }
        };
        const statusInfo = statusMap[status as keyof typeof statusMap] || { text: "Không Xác Định", color: "gray" };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "Số Ngăn Tủ",
      dataIndex: "compartments",
      key: "compartments",
      width: 120,
      render: (compartments: any[]) => compartments?.length || 0,
      align: "right",
    },
    {
      title: 'Thao Tác',
      key: 'action',
      width: 120,
      render: (record: LockerData) => (
        <Space size="small">
          <Tooltip title="Xem Chi Tiết">
            <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => this.showViewModal(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh Sửa Tủ Khóa">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => this.handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Xóa Tủ Khóa">
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => this.handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];


    return (
      <div>
        <h1 style={{ margin: 0 }}>Thiết Lập Tủ</h1>
       
        <Flex justify="end" style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={this.showModal} style={{ backgroundColor: '#52c41a' }}>
            Thêm tủ khóa
          </Button>
          </Flex>
        <Table 
          columns={columns} 
          dataSource={filteredData.length > 0 ? filteredData : data}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="middle"
        />

        {/* Add/Edit Modal */}
        <Modal
          title={editingLocker ? 'Chỉnh Sửa Tủ Khóa' : 'Thêm Tủ Khóa Mới'}
          open={isModalVisible}
          onCancel={this.handleCancel}
          footer={null}
          width={700}
          destroyOnClose={true}
        >
          <Form
            layout="vertical"
            onFinish={this.handleSubmit}
            initialValues={editingLocker ? {
              code: editingLocker.code,
              location_id: editingLocker.location_id,
              status: editingLocker.status,
            } : { status: 1 }}
          >
            <Form.Item
              label="Mã Tủ Khóa"
              name="code"
              rules={[{ required: true, message: 'Vui lòng nhập mã tủ khóa!' }]}
            >
              <Input placeholder="VD: LOC001" />
            </Form.Item>

            <Form.Item
              label="Vị Trí"
              name="location_id"
              rules={[{ required: true, message: 'Vui lòng chọn vị trí!' }]}
            >
              <Select 
                placeholder="Chọn hoặc tìm kiếm vị trí"
                showSearch
                filterOption={(input, option) => {
                  const label = option?.label || option?.children;
                  return String(label).toLowerCase().includes(input.toLowerCase());
                }}
                onSearch={this.onLocationSearch}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <Space style={{ padding: '0 8px 4px' }}>
                      <Button 
                        type="text" 
                        icon={<PlusOutlined />} 
                        onClick={this.showLocationModal}
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        Thêm vị trí mới
                      </Button>
                    </Space>
                  </>
                )}
              >
                {locations.map(location => (
                  <Select.Option key={location.location_id} value={location.location_id}>
                    {location.name} - {location.address}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Trạng Thái"
              name="status"
            >
              <Select>
                <Select.Option value={1}>Hoạt Động</Select.Option>
                <Select.Option value={0}>Không Hoạt Động</Select.Option>
                <Select.Option value={2}>Bảo Trì</Select.Option>
              </Select>
            </Form.Item>

            {!editingLocker && (
              <div>
                <h4>Cấu Hình Ngăn Tủ</h4>
                {sizes.map(size => (
                  <div key={size.size_id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 16,
                    padding: 12,
                    border: '1px solid #d9d9d9',
                    borderRadius: 6
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong>{size.name}</strong>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {size.width_cm} × {size.height_cm} × {size.depth_cm} cm
                      </div>
                    </div>
                    <Form.Item
                      name={['compartments', size.size_id]}
                      style={{ margin: 0, width: 100 }}
                      label={`Số lượng`}
                    >
                      <InputNumber
                        min={0}
                        max={50}
                        placeholder="0"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </div>
                ))}
              </div>
            )}

            <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
              <Space>
                <Button onClick={this.handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingLocker ? 'Cập Nhật' : 'Tạo Mới'}
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
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 22, marginRight: 16 }} />
            <div>
              <p style={{ margin: 0 }}>Bạn có chắc chắn muốn xóa tủ khóa này?</p>
              {deletingLocker && (
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                  <strong>Mã tủ khóa:</strong> {deletingLocker.code}
                </p>
              )}
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal
          title="Chi tiết tủ khóa"
          open={isViewModalVisible}
          onCancel={this.handleViewCancel}
          footer={[
            <Button key="close" onClick={this.handleViewCancel}>
              Đóng
            </Button>
          ]}
          width={600}
        >
          {viewingLocker && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <strong>Mã tủ khóa:</strong> {viewingLocker.locker_id}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Mã tủ khóa:</strong> {viewingLocker.code}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Vị trí:</strong> {viewingLocker.location?.name || viewingLocker.location_name || 'N/A'}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Trạng thái:</strong>{' '}
                <Tag color={viewingLocker.status === 1 ? 'green' : viewingLocker.status === 2 ?'orange' : 'red'}>
                  {viewingLocker.status === 1 ? 'Hoạt động' : viewingLocker.status === 2 ? 'Bảo trì' : 'Không hoạt động'}
                </Tag>
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Tổng ngăn tủ:</strong> {viewingLocker.total_compartments || 0}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Ngăn tủ hoạt động:</strong> {viewingLocker.active_compartments || 0}
              </div>
            </div>
          )}
        </Modal>

        {/* Location Modal */}
        <Modal
          title="Thêm Vị Trí Mới"
          open={isLocationModalVisible}
          onCancel={this.handleLocationCancel}
          footer={null}
          width={600}
          destroyOnClose={true}
        >
          <Form
            layout="vertical"
            onFinish={this.handleLocationSubmit}
            initialValues={{ multiplier: 1.0 }}
          >
            <Form.Item 
              label="Tên vị trí" 
              name="name" 
              rules={[{ required: true, message: 'Vui lòng nhập tên vị trí!' }]}
            >
              <Input placeholder="VD: Chi nhánh Hà Nội" />
            </Form.Item>

            {/* Row 1: Tỉnh/Thành + Quận/Huyện + Phường/Xã */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item 
                label="Tỉnh/Thành" 
                name="ProvinceId" 
                style={{ flex: 1 }}
                rules={[{ required: false }]}
              >
                <Select
                  placeholder="Chọn tỉnh/thành"
                  loading={this.state.loadingProvinces}
                  onChange={this.onProvinceChange}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {this.state.provinces.map((province: Province) => (
                    <Select.Option key={province.ProvinceId} value={province.ProvinceId}>
                      {province.ProvinceName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                label="Huyện/Quận" 
                name="DistrictId" 
                style={{ flex: 1 }}
                rules={[{ required: false }]}
              >
                <Select
                  placeholder="Chọn huyện/quận"
                  loading={this.state.loadingDistricts}
                  onChange={this.onDistrictChange}
                  disabled={!this.state.selectedProvince}
                  allowClear
                >
                  {this.state.districts.map((district: District) => (
                    <Select.Option key={district.DistrictId} value={district.DistrictId}>
                      {district.DistrictName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                label="Xã/Phường" 
                name="WardId" 
                style={{ flex: 1 }}
                rules={[{ required: false }]}
              >
                <Select
                  placeholder="Chọn xã/phường"
                  loading={this.state.loadingWards}
                  disabled={!this.state.selectedDistrict}
                  allowClear
                >
                  {this.state.wards.map((ward: Ward) => (
                    <Select.Option key={ward.WardId} value={ward.WardId}>
                      {ward.WardName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* Row 2: Địa chỉ chi tiết */}
            <Form.Item 
              label="Địa chỉ chi tiết" 
              name="address" 
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết!' }]}
            >
              <Input.TextArea placeholder="VD: 123 Đường Nguyễn Văn Linh" rows={2} />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label="Kinh độ" name="latitude" style={{ flex: 1 }}>
                <Input placeholder="VD: 10.7766" />
              </Form.Item>

              <Form.Item label="Vĩ độ" name="longitude" style={{ flex: 1 }}>
                <Input placeholder="VD: 106.7010" />
              </Form.Item>
            </div>

            <Form.Item label="Hệ số nhân giá" name="multiplier">
              <InputNumber 
                min={0.1} 
                max={5.0}
                step={0.1} 
                precision={2}
                placeholder="1.00"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="Mô tả khu vực" name="area_description">
              <Input.TextArea 
                placeholder="VD: Khu vực trung tâm thương mại sầm uất." 
                rows={3} 
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={this.handleLocationCancel}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Tạo Vị Trí
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default Locker;





















































