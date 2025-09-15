import { Component, type ReactNode } from 'react';
import { Table, Button, Space, Modal, Tooltip, message, Input, Select, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { userService, type User } from '../../../services/userService';
import rentService, { type RentItem } from '../../../services/rentService';
import paymentsService, { type PaymentItem } from '../../../services/paymentsService';
import type { ColumnsType } from 'antd/es/table';


interface UserRow {
  key: string;
  user_id: number;
  name: string;
  phone: string;
  status: number | string;
  code?: string;
  rent_status?: number;
  pending_amount?: number; // cần thanh toán (tổng payments pending)
  total_spent?: number; // tổng chi tiêu (sum paid)
  wallet?: number;
}

interface UserPermissionsState {
  loading: boolean;
  data: UserRow[];
  filtered: UserRow[];
  isViewModalVisible: boolean;
  viewingUser: UserRow | null;
  searchText: string;
  rentStatusFilter: string;
}


class UserPermissions extends Component<{}, UserPermissionsState> {
  state: UserPermissionsState = {
    loading: false,
    data: [],
    filtered: [],
    isViewModalVisible: false,
    viewingUser: null,
    searchText: '',
    rentStatusFilter: 'all',
  };

 

  async componentDidMount() {
    await this.loadData();
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      const [users, rents, payments] = await Promise.all([
        userService.getAllUsers(),
        rentService.list(),
        paymentsService.list(),
      ]);

      // Filter only customers: role_id = 3
      const customers = users.filter((u: User) => u.role_id === 3 || String(u.role_id) === '3');

      // Index rents by user_id (latest or active first)
      const userIdToRents: Record<number, RentItem[]> = {};
      rents.forEach((r) => {
        if (!userIdToRents[r.user_id]) userIdToRents[r.user_id] = [];
        userIdToRents[r.user_id].push(r);
      });

      // Index payments by rent_id
      const rentIdToPayments: Record<number, PaymentItem[]> = {};
      payments.forEach((p) => {
        if (!rentIdToPayments[p.rent_id]) rentIdToPayments[p.rent_id] = [];
        rentIdToPayments[p.rent_id].push(p);
      });

      const rows: UserRow[] = customers.map((u) => {
        const rentsOfUser = userIdToRents[u.id] || [];
        const activeRent = rentsOfUser.find((r) => r.status === 1) || rentsOfUser[0];

        // Locker code from rent through compartment.locker.code
        const code = activeRent?.compartment?.locker?.code;

        // Calculate pending amount: sum payment.amount where payment.status = "pending"
        const paymentsOfUser = rentsOfUser.flatMap((r) => rentIdToPayments[r.rent_id] || []);
        const pending_amount = paymentsOfUser
          .filter((p) => p.status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        // Calculate total spent: sum all payment.amount for this user (regardless of status)
        const total_spent = paymentsOfUser
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        return {
          key: String(u.id),
          user_id: u.id,
          name: u.name,
          phone: u.phone,
          status: activeRent?.status ?? (u.status ?? 1),
          code,
          rent_status: activeRent?.status,
          pending_amount,
          total_spent,
          wallet: u.wallet,
        };
      });

      this.setState({ data: rows, filtered: rows }, () => {
        this.applyFilter();
      });
    } catch (error) {
      message.error('Không thể tải dữ liệu người dùng');
      console.error('Load users error:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  showViewModal = (user: UserRow) => {
    this.setState({ isViewModalVisible: true, viewingUser: user });
  };

  handleViewCancel = () => {
    this.setState({ isViewModalVisible: false, viewingUser: null });
  };

  handleSearch = (value: string) => {
    this.setState({ searchText: value }, this.applyFilter);
  };

  handleStatusFilter = (value: string) => {
    this.setState({ rentStatusFilter: value }, this.applyFilter);
  };

  applyFilter = () => {
    const { data, searchText, rentStatusFilter } = this.state;
    let temp = [...data];
    if (searchText) {
      const q = searchText.toLowerCase();
      temp = temp.filter((r) =>
        r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || String(r.user_id).includes(q)
      );
    }
    if (rentStatusFilter !== 'all') {
      const wanted = Number(rentStatusFilter);
      temp = temp.filter((r) => r.rent_status === wanted);
    }
    this.setState({ filtered: temp });
  };

  

  columns: ColumnsType<UserRow> = [
    { title: 'Mã khách hàng', dataIndex: 'user_id', key: 'user_id', width: 110,align: 'right' },
    { title: 'Họ tên khách hàng', dataIndex: 'name', key: 'name', width: 180 },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone', width: 140,align: 'right'},
    { 
      title: 'Trạng thái', dataIndex: 'rent_status', key: 'rent_status', width: 130,
      render: (status: number | undefined) => {
        if (status === undefined || status === null) return <Tag>Không thuê</Tag>;
        const map: Record<number, { text: string; color: string }> = {
          0: { text: 'Hoàn thành', color: 'green' },
          1: { text: 'Đang thuê', color: 'blue' },
          2: { text: 'Đã hủy', color: 'red' },
        };
        const info = map[status] || { text: String(status), color: 'default' } as any;
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    { title: 'Tủ đang thuê', dataIndex: 'code', key: 'code', width: 140, align:'right' },
    { title: 'Cần thanh toán (VND)', dataIndex: 'pending_amount', key: 'pending_amount', width: 140, render: (v: number = 0) => `${Number(v).toLocaleString()}`,align:'right' },
    { title: 'Tổng chi tiêu (VND)', dataIndex: 'total_spent', key: 'total_spent', width: 140, render: (v: number = 0) => `${Number(v).toLocaleString()}`,align:'right' },
    {
      title: 'Thao tác', key: 'action', width: 80,
      render: (record: UserRow) => (
        <Space size="small">
          <Tooltip title="Xem">
            <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => this.showViewModal(record)} />
          </Tooltip>
        </Space>
      )
    },
  ];

  render(): ReactNode {
    const { loading, filtered, isViewModalVisible, viewingUser, searchText, rentStatusFilter } = this.state;

    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h1 style={{ margin: 0 }}>Quản Lý Người Dùng</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input.Search placeholder="Tìm theo mã, tên, số điện thoại" allowClear value={searchText} onChange={(e) => this.handleSearch(e.target.value)} onSearch={this.handleSearch} style={{ width: 280 }} />
            <Select value={rentStatusFilter} style={{ width: 180 }} onChange={this.handleStatusFilter} options={[
              { label: 'Tất cả trạng thái', value: 'all' },
              { label: 'Đang thuê', value: '1' },
              { label: 'Hoàn thành', value: '0' },
              { label: 'Đã hủy', value: '2' },
            ]} />
          </div>
        </div>
        
        <Table 
          columns={this.columns} 
          dataSource={filtered}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          size="middle"
        />

        <Modal
          title="Chi tiết khách hàng"
          open={isViewModalVisible}
          onCancel={this.handleViewCancel}
          footer={[
            <Button key="close" onClick={this.handleViewCancel}>
              Close
            </Button>
          ]}
          width={500}
        >
          {viewingUser && (
            <div>
              <p><strong>Mã KH:</strong> {viewingUser.user_id}</p>
              <p><strong>Họ tên:</strong> {viewingUser.name}</p>
              <p><strong>SĐT:</strong> {viewingUser.phone}</p>
              <p><strong>Trạng thái:</strong> {String(viewingUser.rent_status ?? viewingUser.status)}</p>
              <p><strong>Tủ đang thuê:</strong> {viewingUser.code || '—'}</p>
              <p><strong>Cần thanh toán:</strong> {(viewingUser.pending_amount || 0).toLocaleString()} VND</p>
              <p><strong>Tổng chi tiêu:</strong> {(viewingUser.total_spent || 0).toLocaleString()} VND</p>
              
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

export default UserPermissions;



























