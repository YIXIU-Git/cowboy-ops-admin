import React, { useState } from 'react';
import {
  Modal, Select, Switch, DatePicker, Button, Space, Table, Tag, Divider, App,
} from 'antd';
import { STORES, PACKAGES, PRODUCTS, pkgById, productById } from '../mock.js';
import { findConflict, isSourceValid, genId } from '../business.js';
import { DragSortList } from './ui.jsx';

const { RangePicker } = DatePicker;

export default function BatchModal({ open, onClose, type, existingList, onApply }) {
  const { message } = App.useApp();
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [range, setRange] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [results, setResults] = useState(null);

  const isCoin = type === 'coin';
  const pool = isCoin ? PACKAGES : PRODUCTS;
  const maxItems = isCoin ? 5 : 3;
  const availablePool = pool.filter((p) => isSourceValid(p));

  const reset = () => {
    setStores([]);
    setItems([]);
    setRange(null);
    setEnabled(true);
    setResults(null);
  };

  const itemAvailable = (itemId, storeId) => {
    const item = isCoin ? pkgById(itemId) : productById(itemId);
    if (!item || !isSourceValid(item)) return null;
    const st = item.stores === 'ALL' ? 'ALL' : item.stores;
    if (st === 'ALL') return true;
    return st.includes(storeId);
  };

  const buildResults = () => {
    if (!stores.length || !items.length) {
      message.warning('请先选择门店与推荐内容');
      return;
    }
    if (items.length > maxItems) {
      message.warning(`人工推荐最多 ${maxItems} 个`);
      return;
    }
    const s = range && range[0] ? range[0].format('YYYY-MM-DD HH:mm') : null;
    const e = range && range[1] ? range[1].format('YYYY-MM-DD HH:mm') : null;
    const rows = stores.map((storeId) => {
      const storeObj = STORES.find((x) => x.id === storeId);
      const draft = {
        id: '__new__', type, stores: [storeId], manual: items, enabled, startTime: s, endTime: e,
      };
      const conflict = findConflict(draft, existingList || []);
      const bad = items.find((id) => !itemAvailable(id, storeId));
      if (conflict) {
        return { storeId, storeName: storeObj.name, ok: false, reason: '该门店所选时间段已存在生效方案' };
      }
      if (bad) {
        const b = isCoin ? pkgById(bad) : productById(bad);
        return {
          storeId, storeName: storeObj.name, ok: false,
          reason: isCoin ? '不存在对应套餐' : '商品不可兑换',
        };
      }
      return { storeId, storeName: storeObj.name, ok: true, reason: '校验通过' };
    });
    setResults(rows);
  };

  const apply = () => {
    if (!results) return;
    const success = results.filter((r) => r.ok);
    if (!success.length) {
      message.error('没有可保存的门店');
      return;
    }
    const s = range && range[0] ? range[0].format('YYYY-MM-DD HH:mm') : null;
    const e = range && range[1] ? range[1].format('YYYY-MM-DD HH:mm') : null;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const drafts = success.map((r) => ({
      id: genId(type),
      type,
      stores: [r.storeId],
      manual: items,
      displayConfig: {}, // 批量配置不携带展示样式，运营可在单条编辑中再补充
      enabled,
      startTime: s,
      endTime: e,
      updater: '当前运营',
      updateTime: now,
    }));
    onApply(drafts, success.map((r) => r.storeName));
    message.success(`成功保存 ${success.length} 家门店，失败 ${results.length - success.length} 家`);
    reset();
    onClose();
  };

  const resultColumns = [
    { title: '门店', dataIndex: 'storeName', width: 120 },
    {
      title: '结果', dataIndex: 'ok', width: 90,
      render: (ok) => (ok ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>),
    },
    { title: '原因', dataIndex: 'reason' },
  ];

  return (
    <Modal
      title="批量门店配置"
      open={open}
      onCancel={() => { reset(); onClose(); }}
      width={720}
      footer={
        <Space>
          <Button onClick={() => { reset(); onClose(); }}>取消</Button>
          <Button onClick={buildResults}>校验并预览</Button>
          <Button type="primary" disabled={!results} onClick={apply}>保存成功门店</Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择多个门店"
          value={stores}
          onChange={setStores}
          options={STORES.map((s) => ({ label: s.name, value: s.id }))}
          maxTagCount="responsive"
        />
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder={`选择推荐${isCoin ? '套餐' : '商品'}（最多 ${maxItems}）`}
          value={items}
          onChange={(v) => setItems(v.slice(0, maxItems))}
          maxCount={maxItems}
          options={availablePool.map((p) => ({
            value: p.id,
            label: isCoin ? `${p.name} · ¥${p.price}/${p.coins}币` : `${p.emoji} ${p.name} · ${p.lottery}彩票`,
          }))}
        />
        <DragSortList
          items={items.map((id) => pool.find((p) => p.id === id)).filter(Boolean)}
          onReorder={(its) => setItems(its.map((i) => i.id))}
          renderItem={(p) => (isCoin ? `${p.name} · ¥${p.price}/${p.coins}币` : `${p.emoji} ${p.name}`)}
        />
        <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} value={range} onChange={setRange} />
        <Space>
          <span>状态：</span>
          <Switch checked={enabled} onChange={setEnabled} checkedChildren="上架" unCheckedChildren="下架" />
        </Space>

        {results && (
          <>
            <Divider>配置结果（成功 {results.filter((r) => r.ok).length} 家 / 失败 {results.filter((r) => !r.ok).length} 家）</Divider>
            <Table
              rowKey="storeId"
              size="small"
              pagination={false}
              columns={resultColumns}
              dataSource={results}
            />
          </>
        )}
      </Space>
    </Modal>
  );
}
