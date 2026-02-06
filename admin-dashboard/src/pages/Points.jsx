import React, { useEffect, useState } from 'react';
import { Table, message, Tag, DatePicker, Space, Button } from 'antd';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Points = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchPointsLog();
  }, [dateRange]);

  const fetchPointsLog = async () => {
    setLoading(true);
    let query = supabase
      .from('points_ledger')
      .select(`
        *,
        profiles:user_id (nickname, phone)
      `)
      .order('created_at', { ascending: false });

    if (dateRange) {
      query = query
        .gte('created_at', dateRange[0].toISOString())
        .lte('created_at', dateRange[1].toISOString());
    }

    const { data: logs, error } = await query;
    if (error) {
      message.error('获取积分流水失败: ' + error.message);
    } else {
      setData(logs);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: '流水ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 100,
    },
    {
      title: '用户',
      dataIndex: ['profiles', 'nickname'],
      key: 'user',
      render: (text, record) => text || record.profiles?.phone || '未知用户',
    },
    {
      title: '变动数量',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => (
        <span style={{ color: val > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
          {val > 0 ? `+${val}` : val}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          purchase: 'blue',
          activity: 'cyan',
          refund: 'orange',
          manual_adjust: 'purple',
          exchange: 'magenta',
          expire: 'default'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '关联单号',
      dataIndex: 'source_id',
      key: 'source_id',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>积分流水记录</h2>
        <Space>
          <RangePicker 
            onChange={(dates) => setDateRange(dates)} 
            placeholder={['开始时间', '结束时间']}
          />
          <Button type="primary" onClick={fetchPointsLog}>刷新</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default Points;
