import React, { useMemo, useState } from 'react';
import {
  Card, Table, Button, Space, Input, Select, Tag, App, Dropdown,
} from 'antd';
import {
  PlusOutlined, ProfileOutlined, AppstoreOutlined, DownOutlined,
  CopyOutlined, DeleteOutlined, EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  calcStatus, autoFill, formatRange, displaySummary, activityDisplaySummary,
} from '../business.js';
import {
  STORES, storeNameList, activityName, activityById, pkgById, productById,
} from '../mock.js';
import { StatusTag } from '../components/ui.jsx';
import ConfigDrawer from '../components/ConfigDrawer.jsx';
import LogModal from '../components/LogModal.jsx';
import BatchModal from '../components/BatchModal.jsx';

const STATUS_OPTIONS = [
  { value: 'pending', label: '未生效' },
  { value: 'active', label: '生效中' },
  { value: 'ended', label: '已结束' },
  { value: 'off_shelf', label: '已下架' },
  { value: 'source_invalid', label: '源对象失效' },
];

function OpsCell({
  type, record, onEdit, onCopy, onToggle, onDelete, onLog,
}) {
  const { message, modal } = App.useApp();

  const handleDelete = () => {
    modal.confirm({
      title: '确认删除该配置？',
      content: '删除后不可恢复，请谨慎操作',
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: () => {
        onDelete(type, record.id);
        message.success('已删除');
      },
    });
  };

  const items = [
    {
      key: 'toggle',
      label: record.enabled ? '下架' : '上架',
      onClick: () => onToggle(type, record.id, !record.enabled),
    },
    {
      key: 'copy',
      label: '复制',
      icon: <CopyOutlined />,
      onClick: () => {
        const copy = onCopy(type, record);
        onEdit(copy);
        message.success('已复制为新配置，可修改后保存（默认下架状态）');
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
    {
      key: 'log',
      label: '日志',
      onClick: onLog,
    },
  ];

  return (
    <Space size={4}>
      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>编辑</Button>
      <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
        <Button type="link" size="small">
          更多 <DownOutlined />
        </Button>
      </Dropdown>
    </Space>
  );
}

function storeHit(configStores, sel) {
  if (!sel) return true;
  if (configStores.includes('ALL')) return true;
  return configStores.includes(sel);
}

// ============ 门店方案式模块（买币 / 商品） ============
export function ItemModule({ type, list, onSave, onToggle, onBatchSave, logs, onOpenLog, onOpenBatch, onDelete, onCopy }) {
  const { message } = App.useApp();
  const [q, setQ] = useState({ store: undefined, status: undefined, keyword: '', range: null });
  const [selected, setSelected] = useState([]);
  const [drawer, setDrawer] = useState({ open: false, record: null });
  const [logOpen, setLogOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  const isCoin = type === 'coin';
  const title = isCoin ? '首页买币推荐' : '首页商品推荐';
  const maxItems = isCoin ? 5 : 3;

  const display = useMemo(() => {
    return (list || []).filter((c) => {
      if (!storeHit(c.stores, q.store)) return false;
      if (q.status && calcStatus(c) !== q.status) return false;
      if (q.keyword) {
        const names = (c.manual || []).map((id) => {
          const it = isCoin ? pkgById(id) : productById(id);
          return it ? it.name : '';
        }).join('');
        if (!names.includes(q.keyword)) return false;
      }
      return true;
    });
  }, [list, q, isCoin]);

  const columns = [
    {
      title: '适用门店', dataIndex: 'stores',
      render: (v) => (v.includes('ALL')
        ? <Tag color="blue">全部门店</Tag>
        : <Space size={[4, 4]} wrap>{v.map((id) => <Tag key={id}>{storeNameList([id])}</Tag>)}</Space>),
    },
    { title: '人工推荐数量', dataIndex: 'manual', render: (v) => (v || []).length },
    { title: '自动补位', render: (_, r) => autoFill(r).length },
    {
      title: '展示配置', width: 230,
      render: (_, r) => {
        const s = displaySummary(r);
        if (!s.total) return '-';
        const isCoin = r.type === 'coin';
        return (
          <Space size={[4, 4]} wrap>
            {isCoin && s.double > 0 && <Tag color="blue">双行×{s.double}</Tag>}
            {isCoin && s.single > 0 && <Tag>单行×{s.single}</Tag>}
            {isCoin && (s.iconOn === s.total ? <Tag color="success">图标全开</Tag> : <Tag>图标{s.iconOn}/{s.total}</Tag>)}
            {s.badge > 0 && <Tag color="magenta">角标×{s.badge}</Tag>}
            {s.customTitle > 0 && <Tag color="purple">标题×{s.customTitle}</Tag>}
            {s.hide > 0 && <Tag color="orange">失效隐藏×{s.hide}</Tag>}
            {!isCoin && s.showMetaOff > 0 && <Tag color="cyan">仅主图×{s.showMetaOff}</Tag>}
          </Space>
        );
      },
    },
    { title: '生效时间', render: (_, r) => formatRange(r.startTime, r.endTime) },
    { title: '推荐状态', render: (_, r) => <StatusTag status={calcStatus(r)} /> },
    { title: '更新时间', dataIndex: 'updateTime' },
    { title: '更新人', dataIndex: 'updater' },
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, r) => (
        <OpsCell
          type={type}
          record={r}
          onEdit={(rec) => setDrawer({ open: true, record: rec })}
          onCopy={onCopy}
          onToggle={onToggle}
          onDelete={onDelete}
          onLog={() => setLogOpen(true)}
        />
      ),
    },
  ];

  const batchShelf = (enabled, label) => {
    if (!selected.length) return message.warning('请先勾选配置');
    selected.forEach((id) => onToggle(type, id, enabled));
    message.success(`已${label} ${selected.length} 项`);
    setSelected([]);
  };

  return (
    <Card
      title={title}
      extra={
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setDrawer({ open: true, record: null })}>新增配置</Button>
          <Button icon={<AppstoreOutlined />} onClick={() => setBatchOpen(true)}>批量门店配置</Button>
          <Button onClick={() => batchShelf(true, '上架')}>批量上架</Button>
          <Button onClick={() => batchShelf(false, '下架')}>批量下架</Button>
          <Button icon={<ProfileOutlined />} onClick={() => setLogOpen(true)}>查看操作日志</Button>
        </Space>
      }
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Select placeholder="门店" allowClear style={{ width: 140 }} value={q.store}
          onChange={(v) => setQ({ ...q, store: v })} options={STORES.map((s) => ({ label: s.name, value: s.id }))} />
        <Select placeholder="状态" allowClear style={{ width: 140 }} value={q.status}
          onChange={(v) => setQ({ ...q, status: v })} options={STATUS_OPTIONS} />
        <Input.Search placeholder="推荐内容名称" allowClear style={{ width: 200 }}
          onSearch={(v) => setQ({ ...q, keyword: v })} onChange={(e) => !e.target.value && setQ({ ...q, keyword: '' })} />
        <Button onClick={() => setQ({ store: undefined, status: undefined, keyword: '', range: null })}>重置</Button>
      </Space>
      <Table
        rowKey="id" size="middle" columns={columns} dataSource={display}
        rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
        scroll={{ x: 1180 }}
        pagination={{ pageSize: 8 }}
      />
      <ConfigDrawer
        open={drawer.open} kind="item" type={type} record={drawer.record}
        existingList={list} onClose={() => setDrawer({ open: false, record: null })}
        onSave={(rec) => { onSave(type, rec); setDrawer({ open: false, record: null }); }}
      />
      <LogModal open={logOpen} onClose={() => setLogOpen(false)} logs={logs} type={type} />
      <BatchModal
        open={batchOpen} onClose={() => setBatchOpen(false)} type={type}
        existingList={list} onApply={(drafts, names) => onBatchSave(type, drafts, names)}
      />
    </Card>
  );
}

// ============ 活动推荐式模块（首页活动 / 活动大厅） ============
export function ActivityModule({ type, list, onSave, onToggle, logs, onOpenLog, onDelete, onCopy }) {
  const { message } = App.useApp();
  const [q, setQ] = useState({ store: undefined, status: undefined, keyword: '' });
  const [selected, setSelected] = useState([]);
  const [drawer, setDrawer] = useState({ open: false, record: null });
  const [logOpen, setLogOpen] = useState(false);

  const isHall = type === 'hall';
  const title = isHall ? '活动大厅配置' : '首页活动推荐';

  const display = useMemo(() => (list || []).filter((c) => {
    if (q.store) {
      if (c.scope === 'all') { /* 全部门店命中任意查询店? 视为命中 */ }
      else if (!c.specifiedStores.includes(q.store)) return false;
    }
    if (q.status && calcStatus(c) !== q.status) return false;
    if (q.keyword && !(activityName(c.activityId).includes(q.keyword))) return false;
    return true;
  }), [list, q]);

  const columns = [
    { title: '活动名称', render: (_, r) => activityName(r.activityId) },
    {
      title: '展示配置', width: 220,
      render: (_, r) => {
        const s = activityDisplaySummary(r);
        return (
          <Space size={[4, 4]} wrap>
                {s.mode === 'image' ? (
                  <>
                    <Tag color="purple">纯图模式</Tag>
                    {s.image && <Tag color="blue">自定义图</Tag>}
                  </>
                ) : (
                  <>
                    {s.badge > 0 && <Tag color="magenta">角标</Tag>}
                    {s.customTitle > 0 && <Tag color="purple">主标题</Tag>}
                    {s.customSub > 0 && <Tag color="cyan">副标题</Tag>}
                    {s.image ? <Tag color="blue">自定义背景</Tag> : (s.theme && s.theme !== 'default' && <Tag color="geekblue">主题{s.theme}</Tag>)}
                  </>
                )}
                {s.stats > 0 && <Tag color="orange">对外数据×{s.stats}</Tag>}
                {s.mode === 'mixed' && s.badge === 0 && s.customTitle === 0 && s.customSub === 0 && s.stats === 0 && !s.image && (s.theme || 'default') === 'default' && '-'}
          </Space>
        );
      },
    },
    { title: '投放范围', render: (_, r) => r.scope === 'all' ? <Tag color="blue">全部门店</Tag> : `指定(${r.specifiedStores.length})` },
    { title: '指定门店', render: (_, r) => r.scope === 'specified' ? storeNameList(r.specifiedStores) || '-' : '-' },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '活动状态', render: (_, r) => {
        const a = activityById(r.activityId);
        return <Tag color={a?.status === 'valid' ? 'success' : 'default'}>{a?.status === 'valid' ? '有效' : a?.status === 'ended' ? '已结束' : '已失效'}</Tag>;
      },
    },
    {
      title: isHall ? '展示状态' : '推荐状态',
      render: (_, r) => <StatusTag status={calcStatus(r)} />,
    },
    { title: isHall ? '展示时间' : '推荐时间', render: (_, r) => formatRange(r.startTime, r.endTime) },
    { title: '更新时间', dataIndex: 'updateTime' },
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, r) => (
        <OpsCell
          type={type}
          record={r}
          onEdit={(rec) => setDrawer({ open: true, record: rec })}
          onCopy={onCopy}
          onToggle={onToggle}
          onDelete={onDelete}
          onLog={() => setLogOpen(true)}
        />
      ),
    },
  ];

  const batchShelf = (enabled, label) => {
    if (!selected.length) return message.warning('请先勾选配置');
    selected.forEach((id) => onToggle(type, id, enabled));
    message.success(`已${label} ${selected.length} 项`);
    setSelected([]);
  };

  return (
    <Card
      title={title}
      extra={
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setDrawer({ open: true, record: null })}>新增配置</Button>
          <Button onClick={() => batchShelf(true, '上架')}>批量上架</Button>
          <Button onClick={() => batchShelf(false, '下架')}>批量下架</Button>
          <Button icon={<ProfileOutlined />} onClick={() => setLogOpen(true)}>查看操作日志</Button>
        </Space>
      }
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Select placeholder="门店" allowClear style={{ width: 140 }} value={q.store}
          onChange={(v) => setQ({ ...q, store: v })} options={STORES.map((s) => ({ label: s.name, value: s.id }))} />
        <Select placeholder="状态" allowClear style={{ width: 140 }} value={q.status}
          onChange={(v) => setQ({ ...q, status: v })} options={STATUS_OPTIONS} />
        <Input.Search placeholder="活动名称" allowClear style={{ width: 200 }}
          onSearch={(v) => setQ({ ...q, keyword: v })} onChange={(e) => !e.target.value && setQ({ ...q, keyword: '' })} />
        <Button onClick={() => setQ({ store: undefined, status: undefined, keyword: '' })}>重置</Button>
      </Space>
      <Table
        rowKey="id" size="middle" columns={columns} dataSource={display}
        rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
        scroll={{ x: 1180 }} pagination={{ pageSize: 8 }}
      />
      <ConfigDrawer
        open={drawer.open} kind="activity" type={type} record={drawer.record}
        existingList={list} onClose={() => setDrawer({ open: false, record: null })}
        onSave={(rec) => { onSave(type, rec); setDrawer({ open: false, record: null }); }}
      />
      <LogModal open={logOpen} onClose={() => setLogOpen(false)} logs={logs} type={type} />
    </Card>
  );
}
