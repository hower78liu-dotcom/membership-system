import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, ShoppingCartOutlined, DollarOutlined, RiseOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeMembers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Mock data for now, real implementation would query Supabase
    // const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    // const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    // For demo purposes until we have data
    setStats({
      totalMembers: 1250,
      totalOrders: 340,
      totalRevenue: 45200.00,
      activeMembers: 890
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>业务概览</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总会员数"
              value={stats.totalMembers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃会员 (近30日)"
              value={stats.activeMembers}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计订单"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总营收 (CNY)"
              value={stats.totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 24 }}>
        <Card title="近期趋势">
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            图表区域 (待集成 Recharts)
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
