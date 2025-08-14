'use client';

import React from 'react';
import { Button, Space, Popconfirm } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';

type ActionButtonsProps = {
  onReset?: () => void;
  onSave?: () => void;
  saveLoading?: boolean;
  disabled?: boolean;
};

export default function ActionButtons({
  onReset,
  onSave,
  saveLoading = false,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Space>
        <Popconfirm
          title="Đặt lại các thay đổi?"
          okText="Đồng ý"
          cancelText="Huỷ"
          onConfirm={onReset}
          disabled={disabled}
        >
          <Button icon={<ReloadOutlined />} disabled={disabled}>
            Reset
          </Button>
        </Popconfirm>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSave}
          loading={saveLoading}
          disabled={disabled}
        >
          Save
        </Button>
      </Space>
    </div>
  );
}
