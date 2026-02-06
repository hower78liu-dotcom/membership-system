import React, { useEffect, useState } from 'react';
import { Table, Tag, Input, Button, Space, message, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const { Option } = Select;

const Orders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (nickname, phone)
      `)
      .order('created_at', { ascending: false });

    if (searchText) {
      query = query.ilike('id', `%${searchText}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: orders, error } = await query;
    if (error) {
      message.error('获取订单失败: ' + error.message);
    } else {
      setData(orders);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) {
      message.error('更新状态失败');
    } else {
      message.success('状态已更新');
      fetchOrders();
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户',
      dataIndex: ['profiles', 'nickname'],
      key: 'user',
      render: (text, record) => (
        <div>
          <div>{text || '未知'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.profiles?.phone}</div>
        </div>
      ),
    },
    {
      title: '支付金额',
      dataIndex: 'pay_amount',
      key: 'pay_amount',
      render: (val) => `¥${val}`,
      sorter: (a, b) => a.pay_amount - b.pay_amount,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => `¥${val}`,
      responsive: ['md'],
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => {
        const map = { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' };
        return map[method] || method;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'gold',
          paid: 'blue',
          shipped: 'cyan',
          completed: 'green',
          cancelled: 'default',
          refunded: 'red'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Select 
          defaultValue={record.status} 
          style={{ width: 100 }} 
          onChange={(val) => handleStatusChange(record.id, val)}
          disabled={['completed', 'cancelled', 'refunded'].includes(record.status)}
        >
          <Option value="paid">已支付</Option>
          <Option value="shipped">已发货</Option>
          <Option value="completed">已完成</Option>
          <Option value="cancelled">取消</Option>
        </Select>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>订单管理</h2>
        <Space>
          <Select defaultValue="all" style={{ width: 120 }} onChange={setStatusFilter}>
            <Option value="all">全部状态</Option>
            <Option value="pending">待支付</Option>
            <Option value="paid">已支付</Option>
            <Option value="completed">已完成</Option>
            <Option value="refunded">已退款</Option>
          </Select>
          <Input.Search
            placeholder="搜索订单号"
            onSearch={() => fetchOrders()}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary" onClick={fetchOrders}>刷新</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default Orders;
