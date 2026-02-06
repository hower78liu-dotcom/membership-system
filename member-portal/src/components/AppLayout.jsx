import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { HomeOutlined, CrownOutlined, PropertySafetyOutlined, GiftOutlined, ShoppingOutlined } from '@ant-design/icons';

const { Content, Footer } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/tiers', icon: <CrownOutlined />, label: '权益' },
    { key: '/points', icon: <PropertySafetyOutlined />, label: '积分' },
    { key: '/coupons', icon: <GiftOutlined />, label: '优惠' },
    { key: '/orders', icon: <ShoppingOutlined />, label: '订单' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', maxWidth: '480px', margin: '0 auto', background: '#fff' }}>
      <Content style={{ padding: '16px', paddingBottom: '60px', overflowY: 'auto', background: '#f5f5f5' }}>
        <Outlet />
      </Content>
      <Footer style={{ 
        position: 'fixed', 
        bottom: 0, 
        width: '100%', 
        maxWidth: '480px',
        padding: 0,
        borderTop: '1px solid #eee',
        zIndex: 1000
      }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ display: 'flex', justifyContent: 'space-around', border: 'none', lineHeight: '46px' }}
        />
      </Footer>
    </Layout>
  );
};

export default AppLayout;
