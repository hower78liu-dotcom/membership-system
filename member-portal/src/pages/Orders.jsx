import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Tag } from 'antd';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const statusMap = {
      pending: { color: 'orange', text: '待支付' },
      paid: { color: 'blue', text: '已支付' },
      shipped: { color: 'cyan', text: '已发货' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' },
      refunded: { color: 'red', text: '已退款' }
  };

  return (
    <div>
      <Typography.Title level={4}>我的订单</Typography.Title>
      <List
        dataSource={orders}
        renderItem={item => (
          <Card size="small" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>{item.id}</span>
                <Tag color={statusMap[item.status]?.color}>{statusMap[item.status]?.text || item.status}</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>实付金额</span>
                <span style={{ fontWeight: 'bold' }}>¥{item.pay_amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginTop: 4 }}>
                <span>下单时间</span>
                <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
            </div>
          </Card>
        )}
      />
    </div>
  );
};

export default Orders;
