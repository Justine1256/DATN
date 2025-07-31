'use client';
import React, { useState } from 'react';
import {
  Form,
  Input,
  Upload,
  Button,
  Switch,
  DatePicker,
  Card,
  Row,
  Col,
  Space,
  message,
  Divider,
  Typography
} from 'antd';
import type { UploadChangeParam, UploadFile, RcFile } from 'antd/es/upload/interface';
import {
  UploadOutlined,
  PlusOutlined,
  EyeOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const BannerForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  // Xử lý upload ảnh
  const handleImageUpload = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Giả lập URL ảnh sau khi upload thành công
      const url = URL.createObjectURL(info.file.originFileObj as RcFile);
      setImageUrl(url);
      setLoading(false);
      message.success('Tải ảnh lên thành công!');
    }
    if (info.file.status === 'error') {
      setLoading(false);
      message.error('Tải ảnh lên thất bại!');
    }
  };

  // Xử lý submit form
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Xử lý dữ liệu form
      const formData = {
        title: values.title,
        image: imageUrl,
        link: values.link || null,
        status: values.status ? 1 : 0,
        start_date: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD HH:mm:ss') : null,
        end_date: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Banner Data:', formData);
      message.success('Thêm banner thành công!');
      
      // Reset form sau khi thành công
      form.resetFields();
      setImageUrl('');
      
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý reset form
  const handleReset = () => {
    form.resetFields();
    setImageUrl('');
    message.info('Đã xóa toàn bộ dữ liệu form');
  };

  // Xử lý preview ảnh
  const handlePreview = () => {
    if (imageUrl) {
      setPreviewVisible(true);
    } else {
      message.warning('Chưa có ảnh để xem trước');
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
    </div>
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card
        style={{ maxWidth: 800, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              <PlusOutlined style={{ marginRight: 8 }} />
              Thêm Banner Mới
            </Title>
            <Text type="secondary">Tạo và quản lý banner cho website</Text>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: true
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={<Text strong>Tiêu đề Banner</Text>}
                name="title"
                rules={[
                  { required: true, message: 'Vui lòng nhập tiêu đề banner!' },
                  { max: 255, message: 'Tiêu đề không được vượt quá 255 ký tự!' }
                ]}
              >
                <Input
                  size="large"
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
                label={<Text strong>Hình ảnh Banner</Text>}
                name="image"
                rules={[
                  { required: true, message: 'Vui lòng tải lên hình ảnh banner!' }
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
              
              {imageUrl && (
                <Button
                  type="dashed"
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  Xem trước ảnh
                </Button>
              )}
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<Text strong>Đường dẫn (Link)</Text>}
                name="link"
                rules={[
                  { type: 'url', message: 'Vui lòng nhập URL hợp lệ!' }
                ]}
              >
                <TextArea
                  placeholder="https://example.com"
                  rows={3}
                  showCount
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Trạng thái</Text>}
                name="status"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Tạm dừng"
                  size="default"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={<Text strong>Thời gian hiển thị</Text>}
                name="dateRange"
              >
                <RangePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                * Để trống nếu muốn banner hiển thị vĩnh viễn
              </Text>
            </Col>
          </Row>

          <Divider />

          <Row justify="center">
            <Col>
              <Space size="middle">
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  size="large"
                  disabled={loading}
                >
                  Làm mới
                </Button>
                
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => form.submit()}
                  loading={loading}
                  size="large"
                  style={{ minWidth: 120 }}
                >
                  {loading ? 'Đang lưu...' : 'Lưu Banner'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Modal xem trước ảnh */}
      {previewVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setPreviewVisible(false)}
        >
          <img
            src={imageUrl}
            alt="Preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BannerForm;