import { Component } from 'react';
import { Table, Tag, Input, Row, Col, Card, Tooltip, Typography, Segmented, Button, ConfigProvider, message } from 'antd';
import { SearchOutlined, EyeOutlined, LockOutlined, UnorderedListOutlined, RiseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import rentService, { type RentItem } from '../../services/rentService';
import lockerService, { type LockerData } from '../../services/lockerService';
import type { ColumnType } from 'antd/es/table/interface';


const { Title } = Typography;

interface LockerDisplayItem {
  id: string;
  location: string;
  locker_code: string;
  status: 'active' | 'locked';
  available_compartments: number;
  revenue: number;
  locker_id: number;
  total_compartments: number;
  active_rents: number;
}

interface RentState {
  data: LockerDisplayItem[];
  loading: boolean;
  searchText: string;
  filteredData: LockerDisplayItem[];
  filter: string;
  isMobile: boolean;
}

// Wrapper component để sử dụng hooks trong class component
const RentWrapper = () => {
  const navigate = useNavigate();
  return <Rent navigate={navigate} />;
};
type T = /*unresolved*/ any

class Rent extends Component<{ navigate: any }, RentState> {
  constructor(props: { navigate: any }) {
    super(props);
    this.state = {
      data: [],
      loading: false,
      searchText: '',
      filteredData: [],
      filter: 'revenue_max',
      isMobile: window.innerWidth < 768,
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      // Load both rents and lockers data
      const [rentsData, lockersData] = await Promise.all([
        rentService.list(),
        lockerService.getLockers()
      ]);

      // Transform the data to match our display format (by locker)
      const transformedData = this.transformLockerData(rentsData, lockersData);
      
      this.setState({ 
        data: transformedData,
        filteredData: transformedData
      });
    } catch (error) {
      console.error('Error loading locker data:', error);
      message.error('Không thể tải dữ liệu tủ khóa');
    } finally {
      this.setState({ loading: false });
    }
  };

  transformLockerData = (rents: RentItem[], lockers: LockerData[]): LockerDisplayItem[] => {
    return lockers.map((locker) => {
      // Find all rents for this locker's compartments
      const lockerRents = rents.filter(rent => 
        (locker as any).compartments?.some((c: any) => c.compartment_id === rent.compartment_id)
      );
      
      // Calculate total revenue from all rents in this locker
      const revenue = lockerRents.reduce((sum, rent) => sum + (rent.total_cost || 0), 0);
      
      // Count available compartments (status = 0 means available)
      const available_compartments = (locker as any).compartments?.filter((c: any) => c.status === 1).length || 0;
      
      // Count total compartments
      const total_compartments = (locker as any).compartments?.length || 0;
      
      // Count active rents
      const active_rents = lockerRents.filter(rent => rent.status === 1).length;
      
      // Determine locker status (active if has any active compartments, locked otherwise)
      const status = (locker as any).status === 1 ? 'active' : 'locked';

      return {
        id: locker.locker_id,
        location: (locker as any).location_name || 'Không xác định',
        locker_code: (locker as any).code || `Tủ ${locker.locker_id}`,
        status,
        available_compartments,
        revenue,
        locker_id: Number(locker.locker_id),
        total_compartments,
        active_rents,
      };
    });
  };

  handleSearch = (value: string) => {
    this.setState({ searchText: value }, () => {
      this.filterData(value, this.state.filter);
    });
  };

  handleFilterChange = (value: string) => {
    this.setState({ filter: value }, () => {
      this.filterData(this.state.searchText, value);
    });
  };

  filterData = (search: string, currentFilter: string) => {
    let temp = [...this.state.data];
    
    // Filter by status
    if (currentFilter === 'active') {
      temp = temp.filter(item => item.status === 'active');
    } else if (currentFilter === 'locked') {
      temp = temp.filter(item => item.status === 'locked');
    }

    // Filter by search text
    if (search) {
      temp = temp.filter(item =>
        item.id.includes(search) ||
        item.locker_code.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.locker_id.toString().includes(search)
      );
    }

    // Sort by revenue if filter is 'revenue_max' (highest revenue first)
    if (currentFilter === 'revenue_max') {
        temp.sort((a, b) => b.revenue - a.revenue);
    }
    
    this.setState({ filteredData: temp });
  };

  handleViewDetails = (record: LockerDisplayItem) => {
    this.props.navigate(`/rent/detail/${record.locker_id}`);
  };

  render() {
    const { loading, filteredData, filter } = this.state;

    const rentColumns: ColumnType<T>[] = [
      { title: 'ID', dataIndex: 'id', key: 'id', responsive: ['md'] as any, align: 'right' },
      { title: 'Nơi đặt', dataIndex: 'location', key: 'location' },
      { title: 'Tên tủ khóa', dataIndex: 'locker_code', key: 'locker_code', responsive: ['md'] as any },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={status === 'active' ? 'green' : 'red'}>
            {status === 'active' ? 'Hoạt động' : 'Khóa'}
          </Tag>
        ),
        responsive: ['md'] as any
      },
      {
        title: 'Tủ còn trống',
        dataIndex: 'available_compartments',
        key: 'available_compartments',
        render: (available: number, record: LockerDisplayItem) => (
          <span>{available}/{record.total_compartments}</span>
        ),
        responsive: ['md'] as any,
         align: 'right',
      },
      {
        title: 'Doanh thu (VND)',
        dataIndex: 'revenue',
        key: 'revenue',
        render: (revenue: number) => new Intl.NumberFormat('vi-VN').format(revenue),
        responsive: ['lg'] as any,
         align: 'right',
      },
      {
        title: 'Đơn thuê đang hoạt động',
        dataIndex: 'active_rents',
        key: 'active_rents',
        render: (activeRents: number) => (
          <Tag color={activeRents > 0 ? 'blue' : 'default'}>
            {activeRents} đơn
          </Tag>
        ),
        responsive: ['lg'] as any
      },
      {
        title: 'Tác vụ',
        key: 'action',
        render: (record: LockerDisplayItem) => (
          <Tooltip title="Xem chi tiết">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              style={{ fontSize: '1.2rem', color: '#52c41a' }}
              onClick={() => this.handleViewDetails(record)}
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
            <div style={{ marginBottom: '32px' }}>
              <Title level={3} style={{ color: '#1f2937', fontWeight: 'bold' }}>Quản Lý Thuê Tủ </Title>
              <p style={{ color: '#4b5563', marginTop: '4px' }}>Danh sách tủ khóa và tình trạng thuê</p>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} justify="space-between" align="middle">
              <Col xs={24} md={18}>
                  <Segmented
                    style={{ width: '100%' }}
                    options={[
                      { 
                        label: (
                          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <RiseOutlined style={{ color: '#6b7280', fontSize: '1.25rem' }} />
                            <span style={{ marginTop: '4px' }}>Doanh thu lớn nhất</span>
                          </div>
                        ),
                        value: 'revenue_max',
                      },
                      { 
                        label: (
                          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <UnorderedListOutlined style={{ color: '#6b7280', fontSize: '1.25rem' }} />
                            <span style={{ marginTop: '4px' }}>Tủ đang hoạt động</span>
                          </div>
                        ),
                        value: 'active',
                      },
                      { 
                        label: (
                          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <LockOutlined style={{ color: '#6b7280', fontSize: '1.25rem' }} />
                            <span style={{ marginTop: '4px' }}>Tủ đang khóa</span>
                          </div>
                        ),
                        value: 'locked',
                      },
                    ]}
                    onChange={this.handleFilterChange}
                    value={filter}
                  />
              </Col>
              <Col xs={24} md={6}>
                <Input.Search
                  placeholder="Tìm kiếm theo ID, tên tủ khóa, nơi đặt"
                  allowClear
                  enterButton={<SearchOutlined />}
                  onSearch={this.handleSearch}
                  style={{ borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
                />
              </Col>
            </Row>

            <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
              <Table
                columns={rentColumns}
                dataSource={filteredData.map((item: any, index: number) => ({ ...item, key: index }))}
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

export default RentWrapper;