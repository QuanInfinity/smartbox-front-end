import { Component, type ReactNode } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, InputNumber, Tooltip, Select, Flex } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import lockerService, { type LocationData } from '../../../services/lockerService';
import addressService, { type Province, type District, type Ward } from '../../../services/addressService';
import type { ColumnsType } from 'antd/es/table';


interface LocationState {
  loading: boolean;
  data: LocationData[];
  isModalVisible: boolean;
  isDeleteModalVisible: boolean;
  isViewModalVisible: boolean;
  editingLocation: LocationData | null;
  deletingLocation: LocationData | null;
  viewingLocation: LocationData | null;
  provinces: Province[];
  districts: District[];
  wards: Ward[];
  selectedProvince: number | null;
  selectedDistrict: number | null;
  loadingProvinces: boolean;
  loadingDistricts: boolean;
  loadingWards: boolean;
  filteredData: LocationData[];
}

class LockerLocations extends Component<{}, LocationState> {
  state: LocationState = {
    loading: false,
    data: [],
    isModalVisible: false,
    isDeleteModalVisible: false,
    isViewModalVisible: false,
    editingLocation: null,
    deletingLocation: null,
    viewingLocation: null,
    provinces: [],
    districts: [],
    wards: [],
    selectedProvince: null,
    selectedDistrict: null,
    loadingProvinces: false,
    loadingDistricts: false,
    loadingWards: false,
    filteredData: [],
  };

  handleFilteredDataChange = (filteredData: LocationData[]) => {
    this.setState({ filteredData });
  };

  componentDidMount() {
    console.log('🚀 LockerLocations component mounted');
    this.loadData();
    this.loadProvinces();
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      const data = await lockerService.getLocations();
      this.setState({ data: data.map(item => ({ ...item, key: item.location_id.toString() })) });
    } catch (error) {
      message.error('Failed to load locations');
      console.error('Load locations error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  loadProvinces = async () => {
    this.setState({ loadingProvinces: true });
    try {
      const provinces = await addressService.getProvinces();
      this.setState({ provinces });
    } catch (error) {
      message.error('Failed to load provinces');
      console.error('Load provinces error:', error);
    } finally {
      this.setState({ loadingProvinces: false });
    }
  };

  onProvinceChange = async (provinceId: number) => {
    this.setState({ 
      selectedProvince: provinceId, 
      selectedDistrict: null,
      districts: [],
      wards: [],
      loadingDistricts: true
    });

    try {
      const districts = await addressService.getDistrictsByProvince(provinceId);
      this.setState({ districts });
    } catch (error) {
      message.error('Failed to load districts');
    } finally {
      this.setState({ loadingDistricts: false });
    }
  };

  onDistrictChange = async (districtId: number) => {
    this.setState({ 
      selectedDistrict: districtId,
      wards: [],
      loadingWards: true
    });

    try {
      const wards = await addressService.getWardsByDistrict(districtId);
      this.setState({ wards });
    } catch (error) {
      message.error('Failed to load wards');
    } finally {
      this.setState({ loadingWards: false });
    }
  };

  showModal = () => {
    this.setState({ isModalVisible: true, editingLocation: null });
  };

  handleEdit = (location: LocationData) => {
    this.setState({ 
      isModalVisible: true, 
      editingLocation: location
    });
  };

  handleDelete = (location: LocationData) => {
    this.setState({ 
      isDeleteModalVisible: true, 
      deletingLocation: location 
    });
  };

  showViewModal = (location: LocationData) => {
    this.setState({ 
      isViewModalVisible: true, 
      viewingLocation: location 
    });
  };

  handleSubmit = async (values: any) => {
    console.log('📝 Form submitted with values:', values);
    this.setState({ loading: true });
    try {
      const locationData = {
        name: values.name,
        address: values.address,
        ProvinceId: values.province_id,
        DistrictId: values.district_id,
        WardId: values.ward_id,
        latitude: parseFloat(values.latitude?.toString().trim() || '0'),
        longitude: parseFloat(values.longitude?.toString().trim() || '0'),
        multiplier: values.multiplier,
        area_description: values.area_description,
      };

      console.log('📤 Sending location data:', locationData);

      if (this.state.editingLocation) {
        console.log('📤 Updating location with ID:', this.state.editingLocation.location_id);
        console.log('📤 Editing location object:', this.state.editingLocation);
        await lockerService.updateLocation(this.state.editingLocation.location_id, locationData);
        message.success('Location updated successfully!');
      } else {
        await lockerService.createLocation(locationData);
        message.success('Location created successfully!');
      }

      this.setState({ isModalVisible: false, editingLocation: null });
      this.loadData();
    } catch (error: any) {
      console.error('❌ Save location error:', error);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      message.error(`Failed to save location: ${error.response?.data?.message || error.message}`);
    } finally {
      this.setState({ loading: false });
    }
  };

  showEditModal = (location: LocationData) => {
    console.log('✏️ Opening edit modal for location:', location);
    console.log('✏️ Location ID:', location.location_id);
    console.log('✏️ Location keys:', Object.keys(location));
    this.setState({ 
      isModalVisible: true, 
      editingLocation: location,
      selectedProvince: location.ProvinceId || null,  // Changed field name
      selectedDistrict: location.DistrictId || null,  // Changed field name
    });
    
    // Load districts and wards if editing
    if (location.ProvinceId) {  // Changed field name
      console.log('🔄 Loading districts for province:', location.ProvinceId);
      this.onProvinceChange(location.ProvinceId);
    }
    if (location.DistrictId) {  // Changed field name
      console.log('🔄 Loading wards for district:', location.DistrictId);
      this.onDistrictChange(location.DistrictId);
    }
  };

  handleDeleteConfirm = async () => {
    const { deletingLocation } = this.state;
    console.log('🗑️ Deleting location:', deletingLocation);
    if (!deletingLocation) return;

    this.setState({ loading: true });
    try {
      await lockerService.deleteLocation(deletingLocation.location_id);
      console.log('✅ Location deleted successfully');
      message.success('Location deleted successfully!');
      this.setState({ isDeleteModalVisible: false, deletingLocation: null });
      await this.loadData();
    } catch (error) {
      console.error('❌ Delete location error:', error);
      message.error('Failed to delete location');
    } finally {
      this.setState({ loading: false });
    }
  };

  handleCancel = () => {
    this.setState({ 
      isModalVisible: false, 
      editingLocation: null,
      selectedProvince: null,
      selectedDistrict: null,
      districts: [],
      wards: []
    });
  };

  handleDeleteCancel = () => {
    this.setState({ isDeleteModalVisible: false, deletingLocation: null });
  };

  handleViewCancel = () => {
    this.setState({ 
      isViewModalVisible: false, 
      viewingLocation: null 
    });
  };

  columns: ColumnsType<LocationData> = [
    {
      title: 'Mã vị trí',
      dataIndex: 'location_id',
      key: 'location_id',
      width: 100,
      align: 'right'
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Địa chỉ đầy đủ',
      dataIndex: 'full_address',
      key: 'full_address',
      width: 400,
      render: (fullAddress: string, record: LocationData) => {
        // Fallback nếu backend chưa trả về full_address
        if (fullAddress) return fullAddress;
        
        const parts = [];
        if (record.address) parts.push(record.address);
        if (record.ward?.WardName) parts.push(record.ward.WardName);
        if (record.district?.DistrictName) parts.push(record.district.DistrictName);
        if (record.province?.ProvinceName) parts.push(record.province.ProvinceName);
        
        return parts.join(', ') || record.address || 'N/A';
      },
    },
    {
      title: 'Hệ số nhân',
      dataIndex: 'multiplier',
      key: 'multiplier',
      width: 100,
      render: (multiplier: number) => `${multiplier}`,
      align: 'right',
    },
    {
      title: 'Tổng số tủ',
      dataIndex: 'total_lockers',
      key: 'total_lockers',
      width: 120,
      render: (count: number) => count || 0,
      align: 'right',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (record: LocationData) => (
        <Space size="small">
          <Tooltip title="Xem Chi Tiết">
            <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => this.showViewModal(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh Sửa Vị Trí">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => this.showEditModal(record)} />
          </Tooltip>
          <Tooltip title="Xóa Vị Trí">
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => this.handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  render(): ReactNode {
    const { loading, data, filteredData, isModalVisible, isDeleteModalVisible, isViewModalVisible, editingLocation, deletingLocation, viewingLocation } = this.state;

    return (
      <div>
         <h1 style={{ margin: 10 }}>Thiết Lập Vị Trí</h1>

        <Flex justify="end" style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={this.showModal} style={{ backgroundColor: '#52c41a',marginBottom: 12 }}>
            Thêm vị trí
          </Button>
        </Flex>
        <Table 
          columns={this.columns} 
          dataSource={filteredData.length > 0 ? filteredData : data}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          size="middle"
        />

        {/* Add/Edit Modal */}
        <Modal
          title={editingLocation ? 'Chỉnh sửa' : 'Thêm'}
          open={isModalVisible}
          onCancel={this.handleCancel}
          footer={null}
          width={600}
          destroyOnClose={true}
          confirmLoading={loading}
        >
          <Form
            layout="vertical"
            onFinish={this.handleSubmit}
            initialValues={this.state.editingLocation ? {
              name: this.state.editingLocation.name,
              address: this.state.editingLocation.address,
              province_id: this.state.editingLocation.ProvinceId,  // Changed field name
              district_id: this.state.editingLocation.DistrictId,  // Changed field name
              ward_id: this.state.editingLocation.WardId,          // Changed field name
              latitude: this.state.editingLocation.latitude,
              longitude: this.state.editingLocation.longitude,
              multiplier: this.state.editingLocation.multiplier,
              area_description: this.state.editingLocation.area_description,
            } : {
              multiplier: 1.0
            }}
            key={this.state.editingLocation ? this.state.editingLocation.location_id : 'new'}
          >
            <Form.Item label="Tên" name="name" rules={[{ required: true, message: 'Hãy nhập tên cho vị trí!' }]}>
              <Input placeholder="e.g., Chi nhánh Hồ Chí Minh" />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item 
                label="Tỉnh/Thành phố" 
                name="province_id" 
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Hãy chọn tỉnh/thành phố!' }]}
              >
                <Select
                  placeholder="Chọn tỉnh/thành phố"
                  loading={this.state.loadingProvinces}
                  onChange={this.onProvinceChange}
                  showSearch
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
                label="Quận/Huyện" 
                name="district_id" 
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Hãy chọn quận/huyện!' }]}
              >
                <Select
                  placeholder="Chọn quận/huyện"
                  loading={this.state.loadingDistricts}
                  onChange={this.onDistrictChange}
                  disabled={!this.state.selectedProvince}
                >
                  {this.state.districts.map((district: District) => (
                    <Select.Option key={district.DistrictId} value={district.DistrictId}>
                      {district.DistrictName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                label="Phường/Xã" 
                name="ward_id" 
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Hãy chọn phường/xã!' }]}
              >
                <Select
                  placeholder="Chọn phường/xã"
                  loading={this.state.loadingWards}
                  disabled={!this.state.selectedDistrict}
                >
                  {this.state.wards.map((ward: Ward) => (
                    <Select.Option key={ward.WardId} value={ward.WardId}>
                      {ward.WardName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item label="Địa Chỉ Chi Tiết" name="address" rules={[{ required: true, message: 'Hãy nhập địa chỉ chi tiết!' }]}>
              <Input.TextArea placeholder="VD: 123 Đường Nguyễn Huệ" rows={2} />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label="Kinh Độ" name="latitude" style={{ flex: 1 }}>
                <Input placeholder="e.g., 10.7766" />
              </Form.Item>

              <Form.Item label="Vĩ Độ" name="longitude" style={{ flex: 1 }}>
                <Input placeholder="e.g., 106.7010" />
              </Form.Item>
            </div>

            <Form.Item label="Hệ Số Nhân Giá" name="multiplier">
              <InputNumber 
                min={0.1} 
                max={5.0}
                step={0.1} 
                precision={2}
                placeholder="1.00"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="Mô Tả Khu Vực" name="area_description">
              <Input.TextArea 
                placeholder="e.g., Khu vực trung tâm thương mại sầm uất." 
                rows={3} 
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={this.handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingLocation ? 'Cập nhật' : 'Thêm'}
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
              <p style={{ margin: 0 }}>Bạn có chắc chắn muốn xóa vị trí này?</p>
              {deletingLocation && (
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                  <strong>Tên:</strong> {deletingLocation.name}
                </p>
              )}
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal
          title="Chi Tiết Vị Trí"
          open={isViewModalVisible}
          onCancel={this.handleViewCancel}
          footer={[
            <Button key="close" onClick={this.handleViewCancel}>
              Đóng
            </Button>
          ]}
          width={600}
        >
          {viewingLocation && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <strong>Mã Vị Trí:</strong> {viewingLocation.location_id}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Tên:</strong> {viewingLocation.name}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Địa Chỉ Đầy Đủ:</strong> {
                  viewingLocation.full_address || 
                  [
                    viewingLocation.address,
                    viewingLocation.ward?.WardName,
                    viewingLocation.district?.DistrictName,
                    viewingLocation.province?.ProvinceName
                  ].filter(Boolean).join(', ')
                }
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Kinh Độ:</strong> {viewingLocation.latitude}, {viewingLocation.longitude}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Hệ Số Nhân Giá:</strong> {viewingLocation.multiplier}x
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Tổng Số Tủ:</strong> {viewingLocation.total_lockers || 0}
              </div>
              {viewingLocation.area_description && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Mô Tả Khu Vực:</strong> {viewingLocation.area_description}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

export default LockerLocations;
























































