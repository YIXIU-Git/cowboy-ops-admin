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
          colorPrimary: '#C2682E',
          colorLink: '#C2682E',
          borderRadius: 8,
          fontSize: 14,
          colorBgLayout: '#f6f4f1',
          controlHeight: 34,
          boxShadowSecondary: '0 6px 20px rgba(60, 40, 20, 0.10)',
          colorTextHeading: 'rgba(0, 0, 0, 0.88)',
        },
        components: {
          Card: { borderRadiusLG: 12 },
          Table: { headerBg: '#faf8f5', headerColor: 'rgba(0,0,0,0.65)', rowHoverBg: '#fbf4ee' },
          Menu: { itemBg: 'transparent', itemSelectedBg: 'rgba(194, 104, 46, 0.16)', itemSelectedColor: '#E89B5C' },
          Tabs: { inkBarColor: '#C2682E', itemSelectedColor: '#C2682E', itemColor: 'rgba(0,0,0,0.65)' },
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
