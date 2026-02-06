import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Tag, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Coupons = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      message.error('获取优惠券失败: ' + error.message);
    } else {
      setData(coupons);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        ...values,
        start_time: values.timeRange[0].toISOString(),
        end_time: values.timeRange[1].toISOString(),
        remaining_quantity: values.total_quantity, // Initial remaining = total
      };
      delete payload.timeRange;

      const { error } = await supabase.from('coupons').insert([payload]);
      
      if (error) throw error;

      message.success('优惠券创建成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchCoupons();
    } catch (error) {
      message.error('创建失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该优惠券活动吗？',
      onOk: async () => {
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) {
          message.error('删除失败: ' + error.message);
        } else {
          message.success('删除成功');
          fetchCoupons();
        }
      },
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'discount' ? 'blue' : type === 'amount_off' ? 'green' : 'orange'}>
          {type === 'discount' ? '折扣券' : type === 'amount_off' ? '满减券' : '兑换券'}
        </Tag>
      ),
    },
    {
      title: '面值/折扣',
      dataIndex: 'value',
      key: 'value',
      render: (val, record) => record.type === 'discount' ? `${val * 10}折` : `¥${val}`,
    },
    {
      title: '门槛',
      dataIndex: 'min_spend',
      key: 'min_spend',
      render: (val) => val > 0 ? `满¥${val}` : '无门槛',
    },
    {
      title: '发放进度',
      key: 'quantity',
      render: (_, record) => `${record.total_quantity - record.remaining_quantity} / ${record.total_quantity}`,
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          {dayjs(record.start_time).format('YYYY-MM-DD')} <br/> 
          至 {dayjs(record.end_time).format('YYYY-MM-DD')}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => <Tag color={active ? 'success' : 'error'}>{active ? '进行中' : '已结束'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>营销活动管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>创建优惠券</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="创建优惠券"
        open={isModalVisible}
        onOk={handleCreate}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="优惠券名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select style={{ width: 120 }}>
                <Option value="amount_off">满减券</Option>
                <Option value="discount">折扣券</Option>
                <Option value="exchange">兑换券</Option>
              </Select>
            </Form.Item>
            <Form.Item name="value" label="面值 (元/折扣率)" rules={[{ required: true }]}>
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="min_spend" label="最低消费门槛" initialValue={0}>
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="total_quantity" label="发行总量" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="timeRange" label="有效时间" rules={[{ required: true }]}>
              <RangePicker showTime />
            </Form.Item>
          </Space>
          <Form.Item name="is_active" label="立即启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Coupons;
