'use client';

import { Modal, InputNumber, DatePicker, Form, message, Radio } from 'antd';
import { API_BASE_URL } from '@/utils/api';
import Cookies from 'js-cookie';

const { RangePicker } = DatePicker;

export default function BulkSaleModal({ open, onCancel, onSuccess, selectedProductIds }: any) {
  const [form] = Form.useForm();
  const token = Cookies.get('authToken');

  const handleBulkSale = async () => {
    if (!token) return message.error('Bạn chưa đăng nhập');

    try {
      const values = await form.validateFields();
      const payload: any = {
        product_ids: selectedProductIds,
        sale_starts_at: values.dates?.[0]?.toISOString() || null,
        sale_ends_at: values.dates?.[1]?.toISOString() || null,
      };

      // ưu tiên discount_type + discount_value
      if (values.discount_type && values.discount_value) {
        payload.discount_type  = values.discount_type;
        payload.discount_value = Number(values.discount_value);
      } else if (values.sale_price) {
        payload.sale_price = Number(values.sale_price);
      } else {
        return message.error('Hãy nhập % hoặc số tiền giảm (hoặc giá sale cụ thể)');
      }

      const res = await fetch(`${API_BASE_URL}/products/sale/bulk`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Lỗi khi đặt sale hàng loạt');
      message.success('Cập nhật sale thành công');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (err) {
      console.error(err);
      message.error('Không thể cập nhật sale');
    }
  };

  return (
    <Modal
      title="Đặt sale hàng loạt"
      open={open}
      onCancel={onCancel}
      onOk={handleBulkSale}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" initialValues={{ discount_type: 'percent' }}>
        <Form.Item label="Kiểu giảm" name="discount_type">
          <Radio.Group>
            <Radio value="percent">% phần trăm</Radio>
            <Radio value="fixed">Số tiền</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Giá trị giảm"
          name="discount_value"
          rules={[{ required: true, message: 'Nhập giá trị giảm' }]}
        >
          <InputNumber min={1} className="w-full" />
        </Form.Item>

        {/* Tuỳ chọn: nếu muốn cho phép nhập trực tiếp sale_price */}
        {/* <Form.Item label="Hoặc nhập trực tiếp Giá sale" name="sale_price">
          <InputNumber min={1} className="w-full" />
        </Form.Item> */}

        <Form.Item label="Thời gian sale" name="dates">
          <RangePicker showTime className="w-full" format="YYYY-MM-DD HH:mm:ss" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
