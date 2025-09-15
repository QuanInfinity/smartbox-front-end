import { Component } from 'react';
import { Table, Tag, Input, Row, Col, Card, Tooltip, Typography, Select, Button, ConfigProvider, message } from 'antd';
import { SearchOutlined, EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import rentService, { type RentItem } from '../../../services/rentService';
import lockerService, { type LockerData } from '../../../services/lockerService';
import CompartmentDetailModal from './CompartmentDetailModal';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

interface CompartmentDisplayItem {
  id: string;
  compartment_code: string;
  status: number; // 0: hoàn thành, 1: đang thuê, 2: quá hạn
  tenant_name: string;
  phone_number: string;
  start_time: string;
  end_time: string;
  amount: number;
  compartment_id: number;
  rent_id: number;
}

interface DetailLockerState {
  lockerData: LockerData | null;
  compartments: CompartmentDisplayItem[];
  loading: boolean;
  searchText: string;
  filteredCompartments: CompartmentDisplayItem[];
  statusFilter: string;
  selectedCompartment: CompartmentDisplayItem | null;
  modalVisible: boolean;
}

// Wrapper component để sử dụng hooks trong class component
const DetailLockerWrapper = () => {
  const params = useParams();
  const navigate = useNavigate();
  return <DetailLocker lockerId={params.lockerId} navigate={navigate} />;
};

class DetailLocker extends Component<{ lockerId?: string; navigate: any }, DetailLockerState> {
  constructor(props: { lockerId?: string; navigate: any }) {
    super(props);
    this.state = {
      lockerData: null,
      compartments: [],
      loading: false,
      searchText: '',
      filteredCompartments: [],
      statusFilter: 'all',
      selectedCompartment: null,
      modalVisible: false,
    };
  }

  async componentDidMount() {
    if (this.props.lockerId) {
      await this.loadData();
    }
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      const lockerId = this.props.lockerId;
      if (!lockerId) return;

      // Load locker data
      const lockers = await lockerService.getLockers();
      const locker = lockers.find(l => l.locker_id.toString() === lockerId);
      
      if (!locker) {
        message.error('Không tìm thấy tủ khóa');
        return;
      }

      // Load rents data
      const rents = await rentService.list();
      console.log('Rents data:', rents); // Debug log
      
      // Transform compartments data
      const compartments = this.transformCompartmentsData(locker, rents);
      
      this.setState({ 
        lockerData: locker,
        compartments,
        filteredCompartments: compartments
      });
    } catch (error) {
      console.error('Error loading locker detail:', error);
      message.error('Không thể tải dữ liệu chi tiết tủ khóa');
    } finally {
      this.setState({ loading: false });
    }
  };

  transformCompartmentsData = (locker: LockerData, rents: RentItem[]): CompartmentDisplayItem[] => {
    const compartments = (locker as any).compartments || [];
    
    return compartments.map((compartment: any) => {
      // Find rent for this compartment
      const rent = rents.find(r => r.compartment_id === compartment.compartment_id);
      console.log('Rent for compartment', compartment.compartment_id, ':', rent); // Debug log
      
      let status = 0; // Default: hoàn thành
      let tenant_name = '';
      let phone_number = '';
      let start_time = '';
      let end_time = '';
      let amount = 0;
      let rent_id = 0;

      if (rent) {
        status = rent.status || 0;
        tenant_name = (rent as any).user?.name || '';
        phone_number = (rent as any).user?.phone_number || '';
        start_time = rent.start_time || '';
        end_time = rent.end_time || '';
        amount = rent.total_cost || 0;
        rent_id = rent.rent_id || 0;
        console.log('Extracted tenant_name:', tenant_name, 'phone:', phone_number); // Debug log
      }

      return {
        id: compartment.compartment_id.toString(),
        compartment_code: compartment.code || `N${compartment.compartment_id}`,
        status,
        tenant_name,
        phone_number,
        start_time,
        end_time,
        amount,
        compartment_id: compartment.compartment_id,
        rent_id,
      };
    });
  };

  handleSearch = (value: string) => {
    this.setState({ searchText: value }, () => {
      this.filterData(value, this.state.statusFilter);
    });
  };

  handleStatusFilterChange = (value: string) => {
    this.setState({ statusFilter: value }, () => {
      this.filterData(this.state.searchText, value);
    });
  };

  filterData = (search: string, statusFilter: string) => {
    let temp = [...this.state.compartments];
    
    // Filter by status
    if (statusFilter !== 'all') {
      const statusValue = parseInt(statusFilter);
      temp = temp.filter(item => item.status === statusValue);
    }

    // Filter by search text
    if (search) {
      temp = temp.filter(item =>
        item.id.includes(search) ||
        item.compartment_code.toLowerCase().includes(search.toLowerCase()) ||
        item.tenant_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    this.setState({ filteredCompartments: temp });
  };

  handleViewCompartmentDetail = (record: CompartmentDisplayItem) => {
    this.setState({
      selectedCompartment: record,
      modalVisible: true
    });
  };

  handleCloseModal = () => {
    this.setState({
      modalVisible: false,
      selectedCompartment: null
    });
  };

  getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="green">Hoàn thành</Tag>;
      case 1:
        return <Tag color="orange">Đang thuê</Tag>;
      case 2:
        return <Tag color="red">Quá hạn</Tag>;
      default:
        return <Tag color="default">Không xác định</Tag>;
    }
  };

  formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  render() {
    const { loading, filteredCompartments, lockerData, modalVisible, selectedCompartment } = this.state;

    const columns: ColumnsType<DetailLocker> = [
      { title: 'ID', dataIndex: 'id', key: 'id', responsive: ['md'] as any, align: 'right' },
      { title: 'Tên ngăn', dataIndex: 'compartment_code', key: 'compartment_code' },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status: number) => this.getStatusTag(status),
      },
      { title: 'Tên người thuê', dataIndex: 'tenant_name', key: 'tenant_name', responsive: ['md'] as any },
      { title: 'Số điện thoại', dataIndex: 'phone_number', key: 'phone_number', responsive: ['lg'] as any, align: 'right' },
      {
        title: 'Thời gian bắt đầu',
        dataIndex: 'start_time',
        key: 'start_time',
        render: (startTime: string) => this.formatDate(startTime),
        responsive: ['lg'] as any,
        align: 'center'
      },
      {
        title: 'Thời gian kết thúc',
        dataIndex: 'end_time',
        key: 'end_time',
        render: (endTime: string) => this.formatDate(endTime),
        responsive: ['lg'] as any,
        align: 'center'
      },
      {
        title: 'Số tiền',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => amount ? new Intl.NumberFormat('vi-VN').format(amount) + '₫' : '-',
        responsive: ['lg'] as any,
        align: 'right'
      },
      {
        title: 'Tác vụ',
        key: 'action',
        render: (record: CompartmentDisplayItem) => (
          <Tooltip title="Xem chi tiết">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              style={{ fontSize: '1.2rem', color: '#52c41a' }}
              onClick={() => this.handleViewCompartmentDetail(record)}
            />
          </Tooltip>
        ),
      },
    ];

    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
            colorBgContainer: '#fff',
          },
        }}
      >
        <div style={{ padding: '32px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => this.props.navigate('/rent')}
                style={{ fontSize: '1.2rem' }}
              />
              <Title level={3} style={{ color: '#1f2937', fontWeight: 'bold', margin: 0 }}>
                Chi Tiết Tủ: {(lockerData as any)?.code || `Tủ ${this.props.lockerId}`}
              </Title>
            </div>

            {/* Filters */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} justify="space-between" align="middle">
              <Col xs={24} md={12}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Lọc theo trạng thái"
                  value={this.state.statusFilter}
                  onChange={this.handleStatusFilterChange}
                >
                  <Option value="all">Tất cả trạng thái</Option>
                  <Option value="1">Đang thuê</Option>
                  <Option value="0">Hoàn thành</Option>
                  <Option value="2">Quá hạn</Option>
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Input.Search
                  placeholder="Tìm kiếm theo ID, tên ngăn, tên người thuê"
                  allowClear
                  enterButton={<SearchOutlined />}
                  onSearch={this.handleSearch}
                  style={{ borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
                />
              </Col>
            </Row>

            {/* Table */}
            <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
              <Table
                columns={columns}
                dataSource={filteredCompartments.map((item: any, index: number) => ({ ...item, key: index }))}
                loading={loading}
                pagination={{
                  showTotal: (total, range) => `Hiển thị kết quả: ${range[0]}-${range[1]} trong ${total} kết quả`,
                  pageSizeOptions: ['10', '20', '50'],
                  showSizeChanger: true,
                }}
                scroll={{ x: true }}
                style={{ width: '100%' }}
                rowClassName="table-row-hover"
              />
            </Card>

            {/* Modal */}
            {selectedCompartment && (
              <CompartmentDetailModal
                visible={modalVisible}
                compartment={selectedCompartment}
                onClose={this.handleCloseModal}
              />
            )}
          </div>
        </div>
        <style>
          {`
          .table-row-hover:hover > td {
            background-color: #f9f9f9 !important;
          }
          `}
        </style>
      </ConfigProvider>
    );
  }
}

export default DetailLockerWrapper;
