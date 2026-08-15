import React from 'react';
import { Modal, Table, Tag, Empty } from 'antd';
import { activityName } from '../mock.js';

const TYPE_LABEL = {
  coin: '首页买币推荐',
  product: '首页商品推荐',
  activity: '首页活动推荐',
  hall: '活动大厅配置',
};

export default function LogModal({ open, onClose, logs, type }) {
  const data = (logs || [])
    .filter((l) => l.type === type)
    .slice()
    .reverse();
  const columns = [
    { title: '操作时间', dataIndex: 'time', width: 150 },
    { title: '模块', dataIndex: 'type', width: 120, render: (t) => TYPE_LABEL[t] || t },
    { title: '操作类型', dataIndex: 'action', width: 110, render: (v) => <Tag>{v}</Tag> },
    { title: '配置ID', dataIndex: 'configId', width: 140 },
    { title: '操作人', dataIndex: 'operator', width: 90 },
    { title: '说明', dataIndex: 'detail' },
  ];
  return (
    <Modal title="操作日志" open={open} onCancel={onClose} footer={null} width={860}>
      {data.length ? (
        <Table rowKey={(r) => r.id} size="small" columns={columns} dataSource={data} pagination={{ pageSize: 8 }} />
      ) : (
        <Empty description="暂无操作日志" />
      )}
    </Modal>
  );
}
