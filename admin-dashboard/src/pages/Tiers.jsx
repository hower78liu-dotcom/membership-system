import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Card } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

const Tiers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    const { data: tiers, error } = await supabase
      .from('membership_tiers')
      .select('*')
      .order('level', { ascending: true });
    
    if (error) {
      message.error('获取等级列表失败: ' + error.message);
    } else {
      setData(tiers);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该等级配置吗？',
      onOk: async () => {
        const { error } = await supabase.from('membership_tiers').delete().eq('id', id);
        if (error) {
          message.error('删除失败: ' + error.message);
        } else {
          message.success('删除成功');
          fetchTiers();
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      let error;
      if (editingRecord) {
        const { error: updateError } = await supabase
          .from('membership_tiers')
          .update(values)
          .eq('id', editingRecord.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('membership_tiers')
          .insert([values]);
        error = insertError;
      }

      if (error) throw error;

      message.success(editingRecord ? '更新成功' : '创建成功');
      setIsModalVisible(false);
      fetchTiers();
    } catch (error) {
      message.error('操作失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '等级名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '等级 (Level)',
      dataIndex: 'level',
      key: 'level',
      sorter: (a, b) => a.level - b.level,
    },
    {
      title: '所需成长值',
      dataIndex: 'required_growth_value',
      key: 'required_growth_value',
    },
    {
      title: '折扣率',
      dataIndex: 'discount_rate',
      key: 'discount_rate',
      render: (text) => `${(text * 10).toFixed(1)}折`,
    },
    {
      title: '积分倍率',
      dataIndex: 'points_ratio',
      key: 'points_ratio',
      render: (text) => `${text}x`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>等级权益配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增等级</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingRecord ? "编辑等级" : "新增等级"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="等级名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="level" label="等级数值 (1, 2, 3...)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="required_growth_value" label="升级所需成长值" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="discount_rate" label="折扣率 (0.00-1.00)" rules={[{ required: true }]}>
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="points_ratio" label="积分倍率" rules={[{ required: true }]}>
            <InputNumber min={1} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tiers;
