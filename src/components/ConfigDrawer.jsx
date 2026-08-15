import React, { useEffect, useState } from 'react';
import {
  Drawer, Form, Select, Switch, DatePicker, InputNumber, Input, Radio,
  Button, Space, Divider, App, Upload, Checkbox,
} from 'antd';
import { PlusOutlined, ProfileOutlined, AppstoreOutlined, PoweroffOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { STORES, PACKAGES, PRODUCTS, ACTIVITIES, activityName } from '../mock.js';
import { findConflict, genId, isSourceValid, ACTIVITY_STAT_OPTIONS } from '../business.js';
import { DragSortList, CsidePreview, ICON_OPTIONS, BADGE_OPTIONS, ACTIVITY_THEME_OPTIONS } from './ui.jsx';

const { RangePicker } = DatePicker;

const storeOptions = [
  { label: '全部门店', value: 'ALL' },
  ...STORES.map((s) => ({ label: s.name, value: s.id })),
];

function normStores(val) {
  if (!val || !val.length) return [];
  if (val.includes('ALL')) return ['ALL'];
  return val.filter((v) => v !== 'ALL');
}

export default function ConfigDrawer({ open, kind, type, record, existingList, onClose, onSave }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [stores, setStores] = useState([]);
  const [manual, setManual] = useState([]);
  const [display, setDisplay] = useState({});
  const [longTerm, setLongTerm] = useState(false);
  const watchedActivityId = Form.useWatch('activityId', form);
  const watchedSort = Form.useWatch('sort', form);

  useEffect(() => {
    if (!open) return;
    if (record) {
      form.setFieldsValue({
        stores: record.stores,
        manual: record.manual || [],
        remark: record.remark || '',
        activityId: record.activityId,
        scope: record.scope || 'all',
        specifiedStores: record.specifiedStores || [],
        sort: record.sort ?? 1,
        range: record.startTime
          ? [dayjs(record.startTime), dayjs(record.endTime)]
          : null,
        enabled: record.enabled !== false,
      });
      setStores(record.stores || []);
      setManual(record.manual || []);
      setDisplay(record.displayConfig || {});
      setLongTerm(!record.startTime && !record.endTime);
    } else {
      form.resetFields();
      form.setFieldsValue({
        stores: [],
        manual: [],
        scope: 'all',
        specifiedStores: [],
        sort: 1,
        enabled: true,
        range: null,
      });
      setStores([]);
      setManual([]);
      setDisplay({});
      setLongTerm(false);
    }
  }, [open, record, form]);

  const onStoreChange = (val) => {
    const v = normStores(val);
    setStores(v);
    form.setFieldValue('stores', v);
  };

  const onManualChange = (val) => {
    const ids = val || [];
    setManual(ids);
    form.setFieldValue('manual', ids);
    // 为新选中的套餐初始化展示配置（沿用默认）
    setDisplay((prev) => {
      const next = { ...prev };
      ids.forEach((id) => { if (!next[id]) next[id] = {}; });
      return next;
    });
  };

  const setDisp = (id, patch) => {
    setDisplay((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  // 活动/大厅：单值展示配置
  const setActDisp = (patch) => {
    setDisplay((prev) => ({ ...(prev || {}), ...patch }));
  };

  const onReorder = (items) => {
    const ids = items.map((i) => i.id);
    setManual(ids);
    form.setFieldValue('manual', ids);
  };

  const handleFinish = (values) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const range = values.range;
    const base = {
      id: record?.id || genId(type),
      type,
      enabled: values.enabled,
      startTime: longTerm || !range || !range[0] ? null : range[0].format('YYYY-MM-DD HH:mm'),
      endTime: longTerm || !range || !range[1] ? null : range[1].format('YYYY-MM-DD HH:mm'),
      updater: '当前运营',
      updateTime: now,
    };

    if (kind === 'item') {
      const draft = {
        ...base,
        stores: values.stores,
        manual: values.manual || [],
        displayConfig: display,
      };
      const conflict = findConflict(draft, existingList || []);
      if (conflict) {
        message.error(
          `该门店在所选时间段已存在首页${type === 'coin' ? '买币' : '商品'}推荐方案，请编辑原配置或调整时间。`
        );
        return;
      }
      onSave(draft);
    } else {
      const draft = {
        ...base,
        remark: values.remark || '',
        activityId: values.activityId,
        scope: values.scope,
        specifiedStores: values.scope === 'specified' ? values.specifiedStores || [] : [],
        sort: values.sort,
        displayConfig: display,
      };
      // sort 唯一性校验：同 list 内（排除自身）不允许重复排序值，保证 C端顺序可预期
      const dup = (existingList || []).find((c) => c.id !== draft.id && c.sort === draft.sort);
      if (dup) {
        message.error(`排序值 ${draft.sort} 已被「${activityName(dup.activityId)}」占用，请调整排序后重试。`);
        return;
      }
      onSave(draft);
    }
  };

  const isCoin = type === 'coin';
  const maxItems = isCoin ? 5 : 3;
  const pool = isCoin ? PACKAGES : PRODUCTS;
  const manualPool = pool.filter((p) => isSourceValid(p) || (manual || []).includes(p.id));

  return (
    <Drawer
      title={record ? '编辑配置' : '新增配置'}
      width={800}
      open={open}
      onClose={onClose}
      maskClosable={false}
      footer={
        <div className="drawer-footer">
          <span className="drawer-footer-hint">
            {kind === 'item'
              ? `已选 ${manual.length} 个推荐${manual.length < maxItems ? `，不足 ${maxItems} 个由系统自动补位` : ''}`
              : '保存后立即生效'}
          </span>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <div className="drawer-layout">
        <div className="drawer-col-left">
          <Form form={form} layout="vertical" onFinish={handleFinish}>
            {kind === 'item' && (
              <>
                <Form.Item
                  name="stores"
                  label="适用门店"
                  rules={[{ required: true, message: '请选择适用门店' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="支持单/多门店，可选全部门店"
                    options={storeOptions}
                    onChange={onStoreChange}
                    maxTagCount="responsive"
                  />
                </Form.Item>

                <Form.Item
                  name="manual"
                  label={`推荐${isCoin ? '套餐' : '商品'}（最多 ${maxItems} 个，留空则由系统自动补位）`}
                >
                  <Select
                    mode="multiple"
                    placeholder={`选择人工推荐${isCoin ? '套餐' : '商品'}`}
                    maxCount={maxItems}
                    onChange={onManualChange}
                    options={manualPool.map((p) => ({
                      value: p.id,
                      label: isCoin
                        ? `${p.name} · ¥${p.price}/${p.coins}币`
                        : `${p.emoji} ${p.name} · ${p.lottery}彩票`,
                      disabled: !isSourceValid(p),
                    }))}
                  />
                </Form.Item>

                <Divider orientation="left" plain>
                  推荐排序（仅人工推荐项，拖拽调整）
                </Divider>
                <DragSortList
                  items={(manual || []).map((id) => pool.find((p) => p.id === id)).filter(Boolean)}
                  onReorder={onReorder}
                  renderItem={(p) =>
                    isCoin
                      ? `${p.name} · ¥${p.price}/${p.coins}币`
                      : `${p.emoji} ${p.name} · ${p.lottery}彩票`
                  }
                />

                <Divider orientation="left" plain>
                  C端展示样式{isCoin ? '（每个套餐可单独配置）' : '（商品直接展示主图，可配角标等）'}
                </Divider>
                {manual.length === 0 ? (
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                    {isCoin ? '未选择套餐，C端将按默认样式（双行+图标）展示' : '未选择商品，C端将按商品主图+默认样式展示'}
                  </div>
                ) : (
                  manual.map((id) => {
                    const p = pool.find((x) => x.id === id);
                    if (!p) return null;
                    const d = display[id] || {};
                    return (
                      <div key={id} className="disp-row">
                        <div className="disp-row-head">
                          <span className="disp-row-name">{isCoin ? p.name : `${p.emoji} ${p.name}`}</span>
                          <span className="disp-row-price">{isCoin ? `¥${p.price}/${p.coins}币` : `${p.lottery}彩票`}</span>
                        </div>
                        <div className="disp-row-controls">
                          <Input
                            size="small"
                            className="disp-sub-input"
                            placeholder={`主标题（默认：${p.name}）`}
                            value={d.title || ''}
                            onChange={(e) => setDisp(id, { title: e.target.value })}
                          />
                          <Select
                            size="small"
                            style={{ width: 118, flex: '0 0 118px' }}
                            value={d.badge || 'none'}
                            onChange={(v) => setDisp(id, { badge: v })}
                            options={BADGE_OPTIONS}
                          />
                        </div>
                        {!isCoin && (
                          <div className="disp-row-controls">
                            <span className="disp-icon-toggle" title="关闭后C端仅展示商品主图，不显示名称和彩票数">
                              显示信息
                              <Switch size="small" checked={d.showMeta !== false} onChange={(v) => setDisp(id, { showMeta: v })} />
                            </span>
                            <span className="disp-icon-toggle disp-hide-toggle" title="商品下架/售罄时，C端直接不展示该卡片（默认仅灰显）">
                              失效隐藏
                              <Switch size="small" checked={d.hideWhenInvalid === true} onChange={(v) => setDisp(id, { hideWhenInvalid: v })} />
                            </span>
                          </div>
                        )}
                        {isCoin && (
                          <>
                            <div className="disp-row-controls">
                              <Select
                                size="small"
                                style={{ width: 110, flex: '0 0 110px' }}
                                value={d.lineMode === 'single' ? 'single' : 'double'}
                                onChange={(v) => setDisp(id, { lineMode: v })}
                                options={[
                                  { value: 'double', label: '双行展示' },
                                  { value: 'single', label: '单行展示' },
                                ]}
                              />
                              <Input
                                size="small"
                                className="disp-sub-input"
                                placeholder={`副文案（默认：${p.benefit}）`}
                                value={d.subText || ''}
                                disabled={d.lineMode === 'single'}
                                onChange={(e) => setDisp(id, { subText: e.target.value })}
                              />
                            </div>
                            <div className="disp-row-controls">
                              <span className="disp-icon-toggle">
                                图标
                                <Switch size="small" checked={d.showIcon !== false} onChange={(v) => setDisp(id, { showIcon: v })} />
                              </span>
                              <Select
                                size="small"
                                style={{ width: 120, flex: '0 0 120px' }}
                                value={d.icon || 'coin'}
                                disabled={d.showIcon === false}
                                onChange={(v) => setDisp(id, { icon: v })}
                                options={ICON_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                              />
                              <span className="disp-icon-toggle disp-hide-toggle" title="套餐下架/售罄时，C端直接不展示该卡片（默认仅灰显）">
                                失效隐藏
                                <Switch size="small" checked={d.hideWhenInvalid === true} onChange={(v) => setDisp(id, { hideWhenInvalid: v })} />
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {kind === 'activity' && (
              <>
                <Form.Item name="remark" label="备注名称（内部备注，非必填）">
                  <Input placeholder="如：暑期指定店" />
                </Form.Item>
                <Form.Item
                  name="activityId"
                  label="活动"
                  rules={[{ required: true, message: '请选择活动' }]}
                >
                  <Select
                    placeholder="选择现有活动"
                    options={ACTIVITIES.filter((a) => a.type === 'normal').map((a) => ({
                      value: a.id,
                      label: `${a.name}（${a.status === 'valid' ? '有效' : a.status === 'ended' ? '已结束' : '已失效'}）`,
                      disabled: a.status !== 'valid',
                    }))}
                  />
                </Form.Item>
                <Form.Item name="scope" label="投放范围" rules={[{ required: true }]}>
                  <Radio.Group>
                    <Radio value="all">全部门店</Radio>
                    <Radio value="specified">指定门店</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item noStyle shouldUpdate={(p, c) => p.scope !== c.scope}>
                  {({ getFieldValue }) =>
                    getFieldValue('scope') === 'specified' ? (
                      <Form.Item
                        name="specifiedStores"
                        label="指定门店"
                        rules={[{ required: true, message: '请选择指定门店' }]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="选择命中门店"
                          options={STORES.map((s) => ({ label: s.name, value: s.id }))}
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
                <Form.Item
                  name="sort"
                  label="排序（越小越靠前）"
                  rules={[{ required: true, message: '请输入排序' }]}
                >
                  <InputNumber min={1} max={999} style={{ width: 160 }} />
                </Form.Item>
                <Divider orientation="left" plain>
                  C端展示样式（活动入口卡片，右侧实时预览）
                </Divider>
                {(() => {
                  const actMode = display.mode === 'image' ? 'image' : 'mixed';
                  const dispImage = display.image || '';
                  const beforeUpload = (file) => {
                    if (!file.type.startsWith('image/')) {
                      message.error('请上传图片文件');
                      return false;
                    }
                    const MAX = 2 * 1024 * 1024; // 2MB，原型阶段限制；真实环境对接 CDN 后改为异步上传
                    if (file.size > MAX) {
                      message.warning(`图片超过 2MB（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB），建议压缩后再上传`);
                    }
                    const reader = new FileReader();
                    reader.onload = (e) => setActDisp({ image: e.target.result });
                    reader.readAsDataURL(file);
                    return false;
                  };
                  return (
                    <>
                      <Form.Item label="展示模式">
                        <Radio.Group
                          value={actMode}
                          onChange={(e) => setActDisp({ mode: e.target.value })}
                          options={[
                            { value: 'mixed', label: '图文模式' },
                            { value: 'image', label: '纯图片模式' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item label={actMode === 'image' ? '入口图片' : '卡片背景图'}>
                        <Space direction="vertical" size={8}>
                          <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
                            <Button icon={<UploadOutlined />}>{dispImage ? '重新上传' : '上传图片'}</Button>
                          </Upload>
                          {dispImage && (
                            <img
                              src={dispImage}
                              alt="uploaded"
                              style={{ maxWidth: 220, maxHeight: 90, borderRadius: 6, border: '1px solid #f0f0f0' }}
                            />
                          )}
                        </Space>
                      </Form.Item>
                      <Form.Item label="对外展示数据">
                        <Checkbox.Group
                          options={ACTIVITY_STAT_OPTIONS}
                          value={display.stats || []}
                          onChange={(vals) => setActDisp({ stats: vals })}
                        />
                      </Form.Item>
                      {actMode === 'mixed' && (
                        <>
                          <Form.Item label="主标题（默认：活动名）">
                            <Input
                              value={display.title || ''}
                              placeholder="默认使用活动名称"
                              onChange={(e) => setActDisp({ title: e.target.value })}
                            />
                          </Form.Item>
                          <Form.Item label="副标题">
                            <Input
                              value={display.subtitle || ''}
                              placeholder="默认使用活动描述"
                              onChange={(e) => setActDisp({ subtitle: e.target.value })}
                            />
                          </Form.Item>
                          <div className="disp-row-controls">
                            <Form.Item label="角标" style={{ marginBottom: 0 }}>
                              <Select
                                size="small"
                                style={{ width: 130 }}
                                value={display.badge || 'none'}
                                onChange={(v) => setActDisp({ badge: v === 'none' ? null : v })}
                                options={BADGE_OPTIONS}
                              />
                            </Form.Item>
                            <Form.Item label="卡片背景" style={{ marginBottom: 0 }}>
                              <Select
                                size="small"
                                style={{ width: 150 }}
                                value={display.theme || 'default'}
                                onChange={(v) => setActDisp({ theme: v })}
                                options={ACTIVITY_THEME_OPTIONS}
                                disabled={!!dispImage}
                              />
                            </Form.Item>
                          </div>
                          {dispImage && (
                            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginTop: -4 }}>
                              已上传背景图，主题色被覆盖
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            <Divider />
            <Form.Item label="生效时间">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Switch
                  checked={longTerm}
                  onChange={(v) => {
                    setLongTerm(v);
                    if (v) form.setFieldValue('range', null);
                  }}
                  checkedChildren="长期有效"
                  unCheckedChildren="自定义时间"
                />
                {!longTerm ? (
                  <Form.Item name="range" noStyle>
                    <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                ) : (
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                    长期有效，不限制展示时间
                  </div>
                )}
              </Space>
            </Form.Item>
            <Form.Item name="enabled" label="状态" valuePropName="checked">
              <Switch checkedChildren="开启/上架" unCheckedChildren="关闭/下架" />
            </Form.Item>
          </Form>
        </div>

        <div className="drawer-col-right">
          <div className="drawer-preview">
            <div className="drawer-preview-head">
              <span>C端效果预览</span>
              <span className="drawer-preview-tip">
                {kind === 'item'
                  ? '卡片可横向滑动查看全部'
                  : '展示全部上架配置，高亮为当前编辑项'}
              </span>
            </div>
            {kind === 'item' ? (
              <CsidePreview config={{ type, stores, manual, displayConfig: display }} type={type} />
            ) : (
              <CsidePreview
                config={{
                  type,
                  editingId: record?.id || '__editing__',
                  configs: [
                    ...(existingList || []).filter((c) => c.id !== record?.id),
                    {
                      id: record?.id || '__editing__',
                      type,
                      activityId: watchedActivityId,
                      sort: watchedSort ?? 1,
                      enabled: true,
                      displayConfig: display,
                    },
                  ],
                }}
                type={type}
              />
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
