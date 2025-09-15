import React, { Component } from 'react';
import { Form, Input, Select, Row, Col, Button } from 'antd';
import type { FormInstance } from 'antd/es/form';

const { Option } = Select;

/**
 * Định nghĩa cấu hình cho một trường trong bộ lọc
 */
export interface FilterConfigItem<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'select' | 'multiselect';
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
}

/**
 * Định nghĩa props cho class component này
 * onFilteredDataChange là một callback để truyền dữ liệu đã lọc về component cha
 */
interface AdvancedFilterProps<T> {
  sourceData: T[];
  filterConfig: FilterConfigItem<T>[];
  onFilteredDataChange: (data: T[]) => void;
}

/**
 * Định nghĩa state cho class component, lưu trữ các giá trị lọc
 */
interface AdvancedFilterState<T> {
  filterValues: Partial<T>;
}

/**
 * Component Class để quản lý và hiển thị bộ lọc nâng cao
 */
export default class AdvancedFilterComponent<T extends { key: React.Key }> extends Component<
  AdvancedFilterProps<T>,
  AdvancedFilterState<T>
> {
  // Tạo một ref để truy cập và gọi các phương thức của Ant Design Form
  formRef = React.createRef<FormInstance>();

  constructor(props: AdvancedFilterProps<T>) {
    super(props);
    this.state = {
      filterValues: {}, // Khởi tạo state với các giá trị lọc rỗng
    };
  }

  /**
   * Phương thức chính để thực hiện việc lọc dữ liệu
   * Nó sẽ được gọi mỗi khi có sự thay đổi trên form
   */
  filterData = (values: Partial<T>) => {
    const { sourceData, filterConfig, onFilteredDataChange } = this.props;

    if (Object.keys(values).length === 0) {
      onFilteredDataChange(sourceData);
      return;
    }

    const filteredData = sourceData.filter(item => {
      return Object.entries(values).every(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          return true;
        }

        const config = filterConfig.find(c => c.name === key);
        if (!config) return true;

        let itemValue: any;
        
        // Handle nested object filtering for compartments
        switch (key) {
          case 'locker':
            itemValue = (item as any).locker?.code || '';
            break;
          case 'location':
            itemValue = (item as any).locker?.location?.name || '';
            break;
          case 'size':
            itemValue = (item as any).size?.name || '';
            break;
          default:
            itemValue = item[key as keyof T];
        }

        if (itemValue === null || itemValue === undefined) {
          return true;
        }

        switch (config.type) {
          case 'text':
            return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
          case 'select':
            return String(itemValue) === String(value);
          case 'multiselect':
            if (Array.isArray(value) && value.length > 0 && Array.isArray(itemValue)) {
              return value.every(v => (itemValue as any[]).includes(v));
            }
            return true;
          default:
            return true;
        }
      });
    });

    onFilteredDataChange(filteredData);
  };

  /**
   * Callback xử lý khi giá trị trên form thay đổi
   * Nó sẽ cập nhật state và sau đó gọi phương thức filterData()
   */
  handleValuesChange = (_: any, allValues: Partial<T>) => {
    this.setState({ filterValues: allValues }, () => {
      // Dùng callback của setState để đảm bảo state đã được cập nhật trước khi lọc
      this.filterData(allValues);
    });
  };

  /**
   * Phương thức reset bộ lọc
   */
  resetFilters = () => {
    this.formRef.current?.resetFields();
    this.setState({ filterValues: {} }, () => {
      this.filterData({});
    });
  };

  // Render form lọc
  render() {
    const { filterConfig } = this.props;
    return (
      <Form
        ref={this.formRef}
        layout="vertical"
        onValuesChange={this.handleValuesChange}
        style={{ marginBottom: '24px', padding: '24px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
      >
        <Row gutter={24}>
          {filterConfig.map(config => (
            <Col span={8} key={String(config.name)}>
              <Form.Item name={config.name as string} label={config.label}>
                {config.type === 'text' && <Input placeholder={config.placeholder} allowClear />}
                {config.type === 'select' && (
                  <Select 
                    placeholder={config.placeholder} 
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {config.options?.map(opt => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                )}
                {config.type === 'multiselect' && (
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder={config.placeholder}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={config.options}
                  />
                )}
              </Form.Item>
            </Col>
          ))}
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button onClick={this.resetFilters}>Đặt lại</Button>
          </Col>
        </Row>
      </Form>
    );
  }
}

