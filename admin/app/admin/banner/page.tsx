'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Modal,
  Form,
  Input,
  Upload,
  Switch,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Image,
  Typography,
  Row,
  Col,
  Divider,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import type { UploadChangeParam, UploadFile, RcFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface Banner {
  id: number;
  title: string;
  image: string;
  link?: string;
  status: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

const BannerManagement = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState('');
  const [searchText, setSearchText] = useState('');

  // Mock data - thay thế bằng API call thực tế
  const mockBanners: Banner[] = [
    {
      id: 1,
      title: 'Banner Khuyến Mãi Tết 2025',
      image: 'https://picsum.photos/400/200?random=1',
      link: 'https://example.com/tet-sale',
      status: 1,
      start_date: '2025-01-01 00:00:00',
      end_date: '2025-02-15 23:59:59',
      created_at: '2025-01-15 10:00:00',
      updated_at: '2025-01-15 10:00:00'
    },
    {
      id: 2,
      title: 'Banner Sản Phẩm Mới',
      image: 'https://picsum.photos/400/200?random=2',
      link: 'https://example.com/new-products',
      status: 1,
      start_date: '2025-01-10 00:00:00',
      end_date: 'null',
      created_at: '2025-01-10 14:30:00',
      updated_at: '2025-01-20 09:15:00'
    },
    {
      id: 3,
      title: 'Banner Giảm Giá 50%',
      image: 'https://picsum.photos/400/200?random=3',
      link: 'abc.com',
      status: 0,
      start_date: '2025-01-05 00:00:00',
      end_date: '2025-01-31 23:59:59',
      created_at: '2025-01-05 16:45:00',
      updated_at: '2025-01-25 11:20:00'
    }
  ];

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBanners(mockBanners);
    } catch (error) {
      message.error('Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBanner(null);
    setImageUrl('');
    form.resetFields();
    form.setFieldsValue({ status: true });
    setModalVisible(true);
  };

  const handleEdit = (record: Banner) => {
    setEditingBanner(record);
    setImageUrl(record.image);
    form.setFieldsValue({
      title: record.title,
      link: record.link,
      status: record.status === 1,
      dateRange: record.start_date && record.end_date ? 
        [dayjs(record.start_date), dayjs(record.end_date)] : undefined
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setBanners(banners.filter(banner => banner.id !== id));
      message.success('Xóa banner thành công');
    } catch (error) {
      message.error('Không thể xóa banner');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      setBanners(banners.map(banner => 
        banner.id === id ? { ...banner, status: newStatus } : banner
      ));
      message.success(`${newStatus === 1 ? 'Kích hoạt' : 'Tạm dừng'} banner thành công`);
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const handleImageUpload = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done' || info.file.originFileObj) {
      const url = URL.createObjectURL(info.file.originFileObj as RcFile);
      setImageUrl(url);
      message.success('Tải ảnh lên thành công');
    }
    if (info.file.status === 'error') {
      message.error('Tải ảnh lên thất bại');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const bannerData = {
        title: values.title,
        image: imageUrl,
        link: values.link || null,
        status: values.status ? 1 : 0,
        start_date: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD HH:mm:ss') : null,
        end_date: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
        created_at: editingBanner ? editingBanner.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingBanner) {
        // Update existing banner
        setBanners(banners.map(banner => 
          banner.id === editingBanner.id 
            ? { ...banner, ...bannerData } 
            : banner
        ));
        message.success('Cập nhật banner thành công');
      } else {
        // Add new banner
        const newBanner = {
          id: Date.now(),
          ...bannerData
        };
        setBanners([...banners, newBanner]);
        message.success('Thêm banner thành công');
      }

      setModalVisible(false);
      form.resetFields();
      setImageUrl('');
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnType<Banner>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 120,
      render: (image: string) => (
        <Image
          src={image}
          alt="banner"
          width={80}
          height={40}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={{
            mask: <EyeOutlined />
          }}
        />
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false,
      },
      render: (title: string) => (
        <Tooltip placement="topLeft" title={title}>
          {title}
        </Tooltip>
      ),
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      width: 150,
      ellipsis: true,
      render: (link: string | null) => (
        link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        ) : (
          <span style={{ color: '#999' }}>Không có</span>
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number, record: Banner) => (
        <Switch
          checked={status === 1}
          onChange={() => handleToggleStatus(record.id, status)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Tạm dừng"
        />
      ),
    },
    {
      title: 'Thời gian hiển thị',
      key: 'display_time',
      width: 180,
      render: (record: Banner) => {
        if (!record.start_date && !record.end_date) {
          return <Tag color="blue">Vĩnh viễn</Tag>;
        }
        
        const now = dayjs();
        const start = record.start_date ? dayjs(record.start_date) : null;
        const end = record.end_date ? dayjs(record.end_date) : null;
        
        let status = 'processing';
        let text = 'Đang hiển thị';
        
        if (start && now.isBefore(start)) {
          status = 'default';
          text = 'Chưa bắt đầu';
        } else if (end && now.isAfter(end)) {
          status = 'error';
          text = 'Đã kết thúc';
        }
        
        return (
          <div>
            <Tag color={status}>{text}</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {start && <div>Từ: {start.format('DD/MM/YYYY')}</div>}
              {end && <div>Đến: {end.format('DD/MM/YYYY')}</div>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record: Banner) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Xóa banner"
            description="Bạn có chắc chắn muốn xóa banner này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                Quản lý Banner
              </Title>
            </Col>
            <Col>
              <Space>
                <Input.Search
                  placeholder="Tìm kiếm banner..."
                  allowClear
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  prefix={<SearchOutlined />}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadBanners}
                  loading={loading}
                >
                  Làm mới
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Thêm banner
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredBanners}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredBanners.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} banner`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal thêm/sửa banner */}
      <Modal
        title={editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner Mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setImageUrl('');
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: true }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Tiêu đề Banner"
                name="title"
                rules={[
                  { required: true, message: 'Vui lòng nhập tiêu đề banner!' },
                  { max: 255, message: 'Tiêu đề không được vượt quá 255 ký tự!' }
                ]}
              >
                <Input
                  placeholder="Nhập tiêu đề cho banner..."
                  showCount
                  maxLength={255}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Hình ảnh Banner"
                name="image"
                rules={[
                  { required: !editingBanner, message: 'Vui lòng tải lên hình ảnh banner!' }
                ]}
              >
                <Upload
                  name="banner"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleImageUpload}
                  accept="image/*"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="banner"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Đường dẫn (Link)"
                name="link"
                rules={[
                  { type: 'url', message: 'Vui lòng nhập URL hợp lệ!' }
                ]}
              >
                <TextArea
                  placeholder="https://example.com"
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                label="Trạng thái"
                name="status"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Tạm dừng"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Thời gian hiển thị"
            name="dateRange"
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={loading}
              >
                {editingBanner ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default BannerManagement;