import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

const Members = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    
    if (searchText) {
      query = query.or(`phone.ilike.%${searchText}%,email.ilike.%${searchText}%,nickname.ilike.%${searchText}%`);
    }

    const { data: members, error } = await query;
    if (error) {
      message.error('Failed to fetch members: ' + error.message);
    } else {
      setData(members);
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchMembers(); // In real app, might want to debounce or use useEffect dependency
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该会员吗？此操作不可恢复。',
      onOk: async () => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
          message.error('删除失败: ' + error.message);
        } else {
          message.success('删除成功');
          fetchMembers();
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', editingRecord.id);

      if (error) {
        throw error;
      }

      message.success('更新成功');
      setIsModalVisible(false);
      fetchMembers();
    } catch (error) {
      message.error('更新失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '积分',
      dataIndex: 'current_points',
      key: 'current_points',
      sorter: (a, b) => a.current_points - b.current_points,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (text) => `¥${text}`,
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>
          {role === 'admin' ? '管理员' : '会员'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleDateString(),
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
        <h2>会员管理</h2>
        <Space>
          <Input.Search
            placeholder="搜索昵称/手机/邮箱"
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton
            allowClear
            onChange={(e) => {
                if (e.target.value === '') {
                    setSearchText('');
                    // setTimeout to allow state update or use useEffect on searchText
                }
            }}
          />
          <Button type="primary" onClick={() => fetchMembers()}>刷新</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="编辑会员信息"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nickname" label="昵称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="current_points" label="当前积分">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="balance" label="余额">
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item name="role" label="角色">
             <Select>
                <Select.Option value="member">会员</Select.Option>
                <Select.Option value="admin">管理员</Select.Option>
             </Select>
          </Form.Item>
          <Form.Item name="is_active" label="状态">
             <Select>
                <Select.Option value={true}>正常</Select.Option>
                <Select.Option value={false}>禁用</Select.Option>
             </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Members;
