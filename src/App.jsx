import React, { useState } from 'react';
import { Layout, Menu, Tabs, Typography, Tag, Badge, Space, Avatar, Divider } from 'antd';
import {
  AppstoreOutlined, GiftOutlined, NotificationOutlined, LayoutOutlined,
} from '@ant-design/icons';
import { INITIAL_CONFIGS } from './mock.js';
import { genId } from './business.js';
import { ItemModule, ActivityModule } from './pages/modules.jsx';

const { Sider, Header, Content } = Layout;

export default function App() {
  const [configs, setConfigs] = useState(INITIAL_CONFIGS);
  const [logs, setLogs] = useState([]);

  const addLog = (entry) =>
    setLogs((prev) => [...prev, { id: genId('log'), time: new Date().toISOString().slice(0, 16).replace('T', ' '), operator: '当前运营', ...entry }]);

  const handleSave = (type, rec) => {
    const exists = (configs[type] || []).some((c) => c.id === rec.id);
    setConfigs((prev) => {
      const list = prev[type] || [];
      return {
        ...prev,
        [type]: exists ? list.map((c) => (c.id === rec.id ? rec : c)) : [...list, rec],
      };
    });
    addLog({
      type, action: exists ? '编辑' : '新增',
      configId: rec.id,
      detail: exists ? '修改配置并保存' : '新增一条配置',
    });
  };

  const handleToggle = (type, id, enabled) => {
    setConfigs((prev) => ({
      ...prev,
      [type]: (prev[type] || []).map((c) => (c.id === id ? { ...c, enabled, updater: '当前运营', updateTime: new Date().toISOString().slice(0, 16).replace('T', ' ') } : c)),
    }));
    addLog({ type, action: enabled ? '上架' : '下架', configId: id, detail: enabled ? '开启展示' : '下架停止展示' });
  };

  const handleBatchSave = (type, drafts, storeNames) => {
    setConfigs((prev) => ({ ...prev, [type]: [...(prev[type] || []), ...drafts] }));
    addLog({
      type, action: '批量配置',
      configId: drafts.map((d) => d.id).join(','),
      detail: `批量门店配置成功 ${storeNames.length} 家：${storeNames.join('、')}`,
    });
  };

  const handleDelete = (type, id) => {
    const rec = (configs[type] || []).find((c) => c.id === id);
    const name = rec
      ? (type === 'activity' || type === 'hall')
        ? rec.activityId
        : (rec.manual || []).join(',')
      : id;
    setConfigs((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((c) => c.id !== id),
    }));
    addLog({ type, action: '删除', configId: id, detail: `删除配置 ${id}（${name}）` });
  };

  const handleCopy = (type, rec) => {
    const copy = {
      ...rec,
      id: genId(type),
      enabled: false, // 复制的新配置默认下架，避免直接生效影响线上，运营确认后手动上架
      updater: '当前运营',
      updateTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      stores: rec.stores ? [...rec.stores] : undefined,
      manual: rec.manual ? [...rec.manual] : undefined,
      specifiedStores: rec.specifiedStores ? [...rec.specifiedStores] : undefined,
      displayConfig: rec.displayConfig ? JSON.parse(JSON.stringify(rec.displayConfig)) : undefined,
    };
    setConfigs((prev) => ({ ...prev, [type]: [...(prev[type] || []), copy] }));
    addLog({
      type, action: '复制', configId: copy.id, detail: `复制自 ${rec.id}（${type}）`,
    });
    return copy;
  };

  const items = [
    {
      key: 'coin', label: '首页买币推荐',
      children: (
        <ItemModule
          type="coin" list={configs.coin} logs={logs}
          onSave={handleSave} onToggle={handleToggle} onBatchSave={handleBatchSave}
          onDelete={handleDelete} onCopy={handleCopy}
        />
      ),
    },
    {
      key: 'product', label: '首页商品推荐',
      children: (
        <ItemModule
          type="product" list={configs.product} logs={logs}
          onSave={handleSave} onToggle={handleToggle} onBatchSave={handleBatchSave}
          onDelete={handleDelete} onCopy={handleCopy}
        />
      ),
    },
    {
      key: 'activity', label: '首页活动推荐',
      children: (
        <ActivityModule
          type="activity" list={configs.activity} logs={logs}
          onSave={handleSave} onToggle={handleToggle}
          onDelete={handleDelete} onCopy={handleCopy}
        />
      ),
    },
    {
      key: 'hall', label: '活动大厅配置',
      children: (
        <ActivityModule
          type="hall" list={configs.hall} logs={logs}
          onSave={handleSave} onToggle={handleToggle}
          onDelete={handleDelete} onCopy={handleCopy}
        />
      ),
    },
  ];

  return (
    <Layout className="app-layout">
      <Sider width={220} className="app-sider">
        <div className="app-logo">
          <div className="app-logo-title">疯狂牛仔城_运营管理系统</div>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['page']}
          items={[
            { key: 'ops', label: '小程序运营', type: 'group', children: [
              { key: 'page', icon: <AppstoreOutlined />, label: '页面运营配置' },
            ] },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space size={12}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              页面运营配置
            </Typography.Title>
            <Tag color="blue">V2.1</Tag>
          </Space>
          <Space size={12}>
            <Badge count={logs.length} showZero color="#0052D9" />
            <Typography.Text type="secondary">操作日志：{logs.length} 条</Typography.Text>
            <Divider type="vertical" style={{ height: 20 }} />
            <Avatar style={{ backgroundColor: '#0052D9', verticalAlign: 'middle' }} size="small">
              运
            </Avatar>
            <Typography.Text strong>当前运营</Typography.Text>
            <Tag color="gold" style={{ marginInlineEnd: 0 }}>运营管理员</Tag>
          </Space>
        </Header>
        <Content style={{ padding: 16 }}>
          <Tabs defaultActiveKey="coin" items={items} size="large" />
        </Content>
      </Layout>
    </Layout>
  );
}
