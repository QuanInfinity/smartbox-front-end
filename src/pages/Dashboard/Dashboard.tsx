import { Component, type ReactNode } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Table, Tag } from 'antd';
import { 
  BarChartOutlined, 
  LockOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined 
} from '@ant-design/icons';
import lockerService from '../../services/lockerService';
import rentService, { type RentItem } from '../../services/rentService';

interface RentData {
  key: string;
  rent_id: number;
  user_name: string | undefined | null  | string;
  compartment_code: string | undefined;
  locker_code: string | undefined | null | string;
  start_time: string | undefined | null | string;
  end_time: string | undefined | null | string;
  total_cost: number | null | undefined;
  status: number | undefined | null;
}

interface DashboardState {
  loading: boolean;
  stats: {
    totalLockers: number;
    activeLockers: number;
    totalCompartments: number;
    availableCompartments: number;
    occupiedCompartments: number;
  } | null;
  recentRents: RentData[];
}

class Dashboard extends Component<{}, DashboardState> {
  state: DashboardState = {
    loading: true,
    stats: null,
    recentRents: [],
  };

  componentDidMount() {
    this.loadStats();
    this.loadRecentRents();
  }

  loadStats = async () => {
    this.setState({ loading: true });
    try {
      const stats = await lockerService.getLockerStats();
      console.log('Dashboard stats loaded:', stats);
      this.setState({ stats });
    } catch (error: any) {
      message.error('Failed to load dashboard statistics');
      console.error('Load stats error:', error);
      console.error('Error details:', error.response?.data || error.message);
      this.setState({
        stats: {
          totalLockers: 0,
          activeLockers: 0,
          totalCompartments: 0,
          availableCompartments: 0,
          occupiedCompartments: 0,
        }
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  loadRecentRents = async () => {
    try {
      const recentRents = await rentService.list();
      this.setState({ recentRents: recentRents.map((rent: RentItem) => ({
        key: rent.rent_id.toString(),
        rent_id: rent.rent_id,
        user_name: rent.user?.name || '',
        compartment_code: rent.compartment?.code,
        locker_code: rent.compartment?.locker?.code,
        start_time: rent.start_time,
        end_time: rent.end_time,
        total_cost: rent.total_cost,
        status: rent.status,
      })) });
    } catch (error) {
      console.error('Load recent rents error:', error);
    }
  };

  rentColumns = [
    {
      title: 'Mã thuê',
      dataIndex: 'rent_id',
      key: 'rent_id',
      width: 80,
    },
    {
      title: 'Người dùng',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
    },
    {
      title: 'Tủ khóa',
      dataIndex: 'locker_code',
      key: 'locker_code',
      width: 100,
    },
    {
      title: 'Ngăn',
      dataIndex: 'compartment_code',
      key: 'compartment_code',
      width: 100,
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 150,
    },
    {
      title: 'Tổng chi phí',
      dataIndex: 'total_cost',
      key: 'total_cost',
      width: 120,
      render: (cost: number | null) => cost ? `${cost.toLocaleString()} VND` : 'Đang tính...',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => {
        const statusMap = {
          0: { text: 'Hoàn Thành', color: 'green' },
          1: { text: 'Đang Hoạt Động', color: 'blue' },
          2: { text: 'Đã Hủy', color: 'red' },
        };
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
  ];

  render(): ReactNode {
    const { loading, stats, recentRents } = this.state;

    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <div>
        <h1>Tổng Quan</h1>
        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 12
            }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: 14 }}>Tổng Locker</span>}
                value={stats?.totalLockers || 0}
                valueStyle={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}
                prefix={<BarChartOutlined style={{ color: 'white' }} />}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card style={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              border: 'none',
              borderRadius: 12
            }}>
              <Statistic
                title={<span style={{ color: 'white', fontSize: 14 }}>Ngăn Trống</span>}
                value={stats?.availableCompartments || 0}
                valueStyle={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}
                prefix={<LockOutlined style={{ color: 'white' }} />}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card style={{ 
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              border: 'none',
              borderRadius: 12
            }}>
              <Statistic
                title={<span style={{ color: '#8b4513', fontSize: 14 }}>Ngăn Đang Dùng</span>}
                value={stats?.occupiedCompartments || 0}
                valueStyle={{ color: '#8b4513', fontSize: 24, fontWeight: 'bold' }}
                prefix={<ExclamationCircleOutlined style={{ color: '#8b4513' }} />}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card style={{ 
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              border: 'none',
              borderRadius: 12
            }}>
              <Statistic
                title={<span style={{ color: '#d63384', fontSize: 14 }}>Locker Hoạt Động</span>}
                value={stats?.activeLockers || 0}
                valueStyle={{ color: '#d63384', fontSize: 24, fontWeight: 'bold' }}
                prefix={<WarningOutlined style={{ color: '#d63384' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Recent Rents Table */}
        <Card title="Đơn thuê gần đây" style={{ borderRadius: 12 }}>
          <Table 
            columns={this.rentColumns} 
            dataSource={recentRents}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
            size="middle"
          />
        </Card>
      </div>
    );
  }
}

export default Dashboard;









