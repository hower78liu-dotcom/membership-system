import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
          message.error('登录失败: 您的邮箱尚未验证，请检查收件箱点击验证链接。');
      } else {
          message.error('登录失败: ' + error.message);
      }
    } else {
      message.success('登录成功');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card title="会员登录" style={{ width: '90%', maxWidth: 400 }}>
        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          
          <Button type="primary" htmlType="submit" block loading={loading} style={{ marginBottom: 12 }}>
            登录
          </Button>
          <div style={{ textAlign: 'center' }}>
            没有账号？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
