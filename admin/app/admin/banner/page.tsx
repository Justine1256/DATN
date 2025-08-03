'use client';

import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Card, Modal, Form, Input, Upload, Switch,
  DatePicker, message, Popconfirm, Tag, Image, Typography, Row, Col, Divider, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ReloadOutlined, SearchOutlined
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import type { UploadChangeParam, UploadFile, RcFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '@/utils/api';

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

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/banner`);
      setBanners(res.data);
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
      await axios.delete(`${API_BASE_URL}/banner/${id}`);
      message.success('Xóa banner thành công');
      loadBanners();
    } catch (error) {
      message.error('Không thể xóa banner');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const banner = banners.find(b => b.id === id);
      if (!banner) return;

      await axios.put(`${API_BASE_URL}/banner/${id}`, { ...banner, status: newStatus });
      message.success(`${newStatus === 1 ? 'Kích hoạt' : 'Tạm dừng'} banner thành công`);
      loadBanners();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const handleImageUpload = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') return;
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
const payload = {
  title: values.title,
  image: imageUrl, // Đây là đường dẫn ảnh vừa upload
  link: values.link || null,
  status: values.status ? 1 : 0,
  start_date: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD HH:mm:ss') : null,
  end_date: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
};

      if (editingBanner) {
        await axios.put(`${API_BASE_URL}/banner/${editingBanner.id}`, payload);
        message.success('Cập nhật banner thành công');
      } else {
        await axios.post(`${API_BASE_URL}/banner`, payload);
        message.success('Thêm banner thành công');
      }

      loadBanners();
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
      sortDirections: ['ascend', 'descend'],
      align: 'center',
    },
    {
      title: 'Ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      align: 'center',
      render: (image: string) => (
        <Image
          src={`${STATIC_BASE_URL}/${image}`}
          alt="banner"
          width={60}
          height={35}
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
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      sorter: (a, b) => a.title.localeCompare(b.title),
      sortDirections: ['ascend', 'descend'],
      render: (title: string) => (
        <Tooltip placement="topLeft" title={title}>
          <span style={{ fontWeight: 500, fontSize: '13px' }}>{title}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      width: 160,
      ellipsis: true,
      render: (link: string | null) => (
        link ? (
          <Tooltip title={link}>
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#DB4444', fontSize: '12px' }}
            >
              {link.length > 20 ? `${link.substring(0, 20)}...` : link}
            </a>
          </Tooltip>
        ) : (
          <span style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>-</span>
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      filters: [
        { text: 'Hoạt động', value: 1 },
        { text: 'Tạm dừng', value: 0 },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: number, record: Banner) => (
        <Switch
          checked={status === 1}
          onChange={() => handleToggleStatus(record.id, status)}
          size="small"
          style={{
    backgroundColor: status === 1 ? '#52c41a' : '#f5222d', // Xanh lá & đỏ
  }}
        />
      ),
    },
    {
      title: 'Hiển thị',
      key: 'display_time',
      width: 180,
      align: 'center',
      filters: [
        { text: 'Vĩnh viễn', value: 'permanent' },
        { text: 'Hoạt động', value: 'active' },
        { text: 'Chờ', value: 'pending' },
        { text: 'Hết hạn', value: 'expired' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (record: Banner) => {
        if (!record.start_date && !record.end_date) {
          return <Tag color="blue" style={{ fontSize: '11px', padding: '2px 8px', margin: 0 }}>Vĩnh viễn</Tag>;
        }
        
        const now = dayjs();
        const start = record.start_date ? dayjs(record.start_date) : null;
        const end = record.end_date ? dayjs(record.end_date) : null;
        
        let status = 'processing';
        let text = 'Hoạt động';
        
        if (start && now.isBefore(start)) {
          status = 'default';
          text = 'Chờ';
        } else if (end && now.isAfter(end)) {
          status = 'error';
          text = 'Hết hạn';
        }
        
        return (
          <div style={{ textAlign: 'center' }}>
            <Tag color={status} style={{ fontSize: '11px', padding: '2px 8px', margin: '0 0 4px 0' }}>
              {text}
            </Tag>
            <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.2' }}>
              {start && <div>{start.format('DD/MM/YYYY HH:mm')}</div>}
              {end && start && <div style={{ margin: '2px 0' }}>đến</div>}
              {end && <div>{end.format('DD/MM/YYYY HH:mm')}</div>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 80,
      align: 'center',
      render: (date: string) => (
        <div style={{ fontSize: '12px' }}>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'descend',
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 80,
      align: 'center',
      render: (date: string) => (
        <div style={{ fontSize: '12px' }}>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record: Banner) => (
        <Space size={4}>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
              style={{ color: '#DB4444', padding: '2px' }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, style: { backgroundColor: '#DB4444', borderColor: '#DB4444' } }}
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                style={{ padding: '2px', color: '#DB4444' }}
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
    <div style={{ 
      padding: '12px', 
      width: '100%', 
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Card style={{ 
        width: '100%', 
        height: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }} bodyStyle={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          marginBottom: '12px',
          flexShrink: 0
        }}>
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
                  style={{ backgroundColor: '#fff', borderColor: '#DB4444', color: '#DB4444' }}
                >
                  Làm mới
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
                >
                  Thêm banner
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ 
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Table
            columns={columns}
            dataSource={filteredBanners}
            rowKey="id"
            loading={loading}
            size="small"
            bordered
            pagination={{
              total: filteredBanners.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} banner`,
              pageSizeOptions: ['10', '20', '50', '100'],
              size: 'small',
            }}
            scroll={{ 
              y: 'calc(100vh - 240px)'
            }}
            style={{ 
              width: '100%',
              height: '100%'
            }}
          />
        </div>
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
  name="file"
  listType="picture-card"
  showUploadList={false}
  accept="image/*"
  action={`${API_BASE_URL}/banner/upload-banner`}
  onChange={(info) => {
    if (info.file.status === 'uploading') {
      message.loading({ content: 'Đang tải ảnh lên...', key: 'upload' });
    }
    if (info.file.status === 'done') {
      const url = info.file.response.url;
      setImageUrl(url); // lưu path (relative)
      message.success({ content: 'Tải ảnh thành công', key: 'upload' });
    }
    if (info.file.status === 'error') {
      message.error({ content: 'Tải ảnh thất bại', key: 'upload' });
    }
  }}
>
  {imageUrl ? (
    <img
      src={`${STATIC_BASE_URL}/${imageUrl}`}
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
              <Button 
                onClick={() => setModalVisible(false)}
                style={{ backgroundColor: 'white', borderColor: '#DB4444', color: '#DB4444' }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={loading}
                style={{ backgroundColor: '#DB4444', borderColor: '#DB4444' }}
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