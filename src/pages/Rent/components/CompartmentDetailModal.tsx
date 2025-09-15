import { Component } from 'react';
import { Modal, Table, Tag, Typography, Button, ConfigProvider, message, Row, Col, Card } from 'antd';
import { CheckOutlined, PhoneOutlined } from '@ant-design/icons';
import rentService, { type RentItem } from '../../../services/rentService';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface CompartmentDetailModalProps {
  visible: boolean;
  compartment: {
    id: string;
    compartment_code: string;
    status: number;
    tenant_name: string;
    phone_number: string;
    start_time: string;
    end_time: string;
    amount: number;
    compartment_id: number;
    rent_id: number;
  };
  onClose: () => void;
}

interface RentalHistoryItem {
  phone_number: string;
  start_time: string;
  end_time: string;
  rental_type: string;
  payment_method: string;
  amount: number;
  payment_status: number;
  rent_id: number;
}

interface CompartmentDetailModalState {
  currentRental: RentItem | null;
  rentalHistory: RentalHistoryItem[];
  loading: boolean;
  calling: boolean;
  callModalVisible: boolean;
  callingPhoneNumber: string;
}

class CompartmentDetailModal extends Component<CompartmentDetailModalProps, CompartmentDetailModalState> {
  constructor(props: CompartmentDetailModalProps) {
    super(props);
    this.state = {
      currentRental: null,
      rentalHistory: [],
      loading: false,
      calling: false,
      callModalVisible: false,
      callingPhoneNumber: '',
    };
  }

  async componentDidMount() {
    if (this.props.visible) {
      await this.loadData();
    }
  }

  async componentDidUpdate(prevProps: CompartmentDetailModalProps) {
    if (this.props.visible && !prevProps.visible) {
      await this.loadData();
    }
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      // Load current rental data
      const rents = await rentService.list();
      const currentRent = rents.find(r => r.compartment_id === this.props.compartment.compartment_id && r.status === 1);
      
      // Load rental history (all rents for this compartment)
      const history = rents
        .filter(r => r.compartment_id === this.props.compartment.compartment_id)
        .map(rent => {
          const receiverInfo = this.getReceiverInfo(rent);
          return {
            phone_number: receiverInfo.phone,
            start_time: rent.start_time || '',
            end_time: rent.end_time || '',
            rental_type: this.getRentalTypeText(rent.rental_type??""),
            payment_method: this.getPaymentMethodText(rent.payment_method??""),
            amount: rent.total_cost || 0,
            payment_status: rent.payment_status || 0,
            rent_id: rent.rent_id || 0,
          };
        });

      this.setState({
        currentRental: currentRent || null,
        rentalHistory: history
      });
    } catch (error) {
      console.error('Error loading compartment detail:', error);
      message.error('Không thể tải dữ liệu chi tiết ngăn tủ');
    } finally {
      this.setState({ loading: false });
    }
  };

  getRentalTypeText = (type: string) => {
    switch (type) {
      case 'rental':
        return 'Thuê tủ';
      case 'delivery':
        return 'Gửi hàng';
      default:
        return 'Không xác định';
    }
  };

  getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Chuyển khoản';
      case 'wallet':
        return 'Qua ví';
      case 'cash':
        return 'Tiền mặt';
      default:
        return 'Không xác định';
    }
  };

  getPaymentStatusTag = (status: number) => {
    switch (status) {
      case 1:
        return <Tag color="green">Đã thanh toán</Tag>;
      case 0:
        return <Tag color="orange">Quá hạn</Tag>;
      default:
        return <Tag color="default">Chưa thanh toán</Tag>;
    }
  };

  getReceiverInfo = (rent: RentItem) => {
    // Nếu là gửi hàng hoặc thuê ngắn hạn, người nhận hàng chính là người thuê
    if (rent.rental_type === 'delivery' || rent.rental_type === 'short_term') {
      return {
        name: (rent as any).user?.name || '-',
        phone: (rent as any).user?.phone_number || '-'
      };
    }
    
    // Nếu có receiver_phone khác với phone của user, đó là người được ủy quyền
    if (rent.receiver_phone && rent.receiver_phone !== (rent as any).user?.phone_number) {
      return {
        name: 'Người được ủy quyền',
        phone: rent.receiver_phone
      };
    }
    
    // Mặc định là người thuê
    return {
      name: (rent as any).user?.name || '-',
      phone: (rent as any).user?.phone_number || '-'
    };
  };

 

  handleCall = (phoneNumber: string) => {
    this.setState({ 
      calling: true,
      callModalVisible: true,
      callingPhoneNumber: phoneNumber
    });
    
    // Simulate call
    setTimeout(() => {
      this.setState({ 
        calling: false,
        callModalVisible: false,
        callingPhoneNumber: ''
      });
      message.success('Cuộc gọi đã kết thúc');
    }, 10000); // 10 seconds
  };

  formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  render() {
    const { visible, compartment, onClose } = this.props;
    const { currentRental, rentalHistory, loading, calling } = this.state;

    const historyColumns: ColumnsType<RentalHistoryItem> = [
      { title: 'SĐT Người nhận hàng', dataIndex: 'phone_number', key: 'phone_number', align: 'right' },
      {
        title: 'Thời gian bắt đầu/kết thúc',
        key: 'time_range',
        render: (record: RentalHistoryItem) => (
          <div>
            <div>{this.formatDateTime(record.start_time)}</div>
            <div style={{ color: '#666' }}>- {this.formatDateTime(record.end_time)}</div>
          </div>
        ),
        align: 'center'
      },
      { title: 'Loại giao dịch', dataIndex: 'rental_type', key: 'rental_type' },
      { title: 'Phương thức thanh toán', dataIndex: 'payment_method', key: 'payment_method' },
      {
        title: 'Số tiền',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + '₫',
        align: 'right'
      },
      {
        title: 'Trạng thái giao dịch',
        dataIndex: 'payment_status',
        key: 'payment_status',
        render: (status: number) => this.getPaymentStatusTag(status),
      },
      {
        title: 'Thao tác',
        key: 'action',
        render: (record: RentalHistoryItem) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="text"
              icon={<CheckOutlined />}
              style={{ color: record.payment_status === 1 ? '#999' : '#52c41a' }}
              disabled={record.payment_status === 1}
              
            />
            <Button
              type="text"
              icon={<PhoneOutlined />}
              style={{ color: calling ? '#999' : '#1890ff' }}
              disabled={calling}
              onClick={() => this.handleCall(record.phone_number)}
            />
          </div>
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
        <Modal
          title={
            <Title level={4} style={{ margin: 0 }}>
              Chi Tiết Ngăn Tủ: {compartment.compartment_code}
            </Title>
          }
          open={visible}
          onCancel={onClose}
          footer={null}
          width={1200}
          style={{ top: 20 }}
        >
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Current Rental Info */}
            <Card title="Người thuê hiện tại" style={{ marginBottom: '24px' }}>
              {currentRental ? (
                <Row gutter={[24, 16]}>
                  <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Người thuê:</Text> {(currentRental as any).user?.name || '-'}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Thời gian bắt đầu:</Text> {this.formatDate(currentRental.start_time)}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Số tiền:</Text> {new Intl.NumberFormat('vi-VN').format(currentRental.total_cost || 0)}₫
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Loại giao dịch:</Text> {this.getRentalTypeText(currentRental.rental_type ?? "")}
                    </div>
                    <div>
                      <Text strong>Người nhận hàng:</Text> {this.getReceiverInfo(currentRental).name}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Số điện thoại:</Text> {(currentRental as any).user?.phone_number || '-'}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Thời gian kết thúc:</Text> {this.formatDate(currentRental.end_time ?? "")}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Trạng thái:</Text> {this.getPaymentStatusTag(currentRental.payment_status || 0)}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>Phương thức thanh toán:</Text> {this.getPaymentMethodText(currentRental.payment_method ?? "")}
                    </div>
                    <div>
                      <Text strong>SĐT Người nhận hàng:</Text> {this.getReceiverInfo(currentRental).phone}
                    </div>
                  </Col>
                </Row>
              ) : (
                <Text type="secondary">Không có thông tin người thuê hiện tại</Text>
              )}
            </Card>

            {/* Rental History */}
            <Card title="Lịch sử thuê">
              <Table
                columns={historyColumns}
                dataSource={rentalHistory.map((item: any, index: number) => ({ ...item, key: index }))}
                loading={loading}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
                }}
                scroll={{ x: true }}
                size="small"
              />
            </Card>
          </div>
        </Modal>

        {/* Call Modal */}
        <Modal
          title="Đang thực hiện cuộc gọi"
          open={this.state.callModalVisible}
          footer={null}
          closable={false}
          width={400}
          centered
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <PhoneOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Đang gọi đến
            </div>
            <div style={{ fontSize: '24px', color: '#1677ff', marginBottom: '16px' }}>
              {this.state.callingPhoneNumber}
            </div>
            <div style={{ color: '#666' }}>
              Cuộc gọi sẽ kết thúc sau 10 giây...
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    );
  }
}

export default CompartmentDetailModal;
