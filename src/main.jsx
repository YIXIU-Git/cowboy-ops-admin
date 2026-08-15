import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import App from './App.jsx';
import './index.css';

dayjs.locale('zh-cn');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0052D9',
          colorLink: '#0052D9',
          borderRadius: 6,
          fontSize: 14,
          colorBgLayout: '#f3f4f7',
          controlHeight: 32,
          boxShadowSecondary: '0 4px 16px rgba(15, 30, 70, 0.08)',
          colorTextHeading: 'rgba(0, 0, 0, 0.88)',
        },
        components: {
          Card: { borderRadiusLG: 8 },
          Table: { headerBg: '#f7f8fa', headerColor: 'rgba(0,0,0,0.65)', rowHoverBg: '#f2f6ff', headerSplitColor: 'transparent' },
          Menu: { itemBg: 'transparent', itemSelectedBg: 'rgba(0,82,217,0.08)', itemSelectedColor: '#0052D9', itemHoverBg: 'rgba(0,82,217,0.05)' },
          Tabs: { inkBarColor: '#0052D9', itemSelectedColor: '#0052D9', itemColor: 'rgba(0,0,0,0.65)' },
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
