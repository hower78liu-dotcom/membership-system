import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, DatePicker } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, SmileOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const { email, password, nickname, phone, gender, birthday } = values;

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
            nickname,
            phone,
            gender,
            birthday: birthday ? birthday.format('YYYY-MM-DD') : null
        }
      }
    });

    if (error) {
      if (error.message.includes('rate limit')) {
          message.error('注册过于频繁，请稍后再试或联系管理员。');
      } else {
          message.error('注册失败: ' + error.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
        // Manually update profile to ensure all fields are saved
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                nickname, 
                phone,
                gender,
                birthday: birthday ? birthday.format('YYYY-MM-DD') : null
            })
            .eq('id', data.user.id);
        
        if (updateError) {
             console.error('Profile update failed:', updateError);
        }
        
        // Check if email confirmation is required
        if (data.session) {
            message.success('注册成功，已自动登录');
            navigate('/');
        } else if (data.user && !data.session) {
            // Email confirmation required
            message.success('注册成功！请前往您的邮箱确认验证链接，完成后即可登录。', 6);
            navigate('/login');
        } else {
             message.success('注册成功，请登录');
             navigate('/login');
        }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card title="会员注册" style={{ width: '90%', maxWidth: 400 }}>
        <Form name="register" onFinish={onFinish} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码 (至少6位)" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input prefix={<SmileOutlined />} placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<MobileOutlined />} placeholder="请输入手机号" />
          </Form.Item>
          
          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
             <Select placeholder="请选择性别">
                 <Option value="male">男</Option>
                 <Option value="female">女</Option>
                 <Option value="other">其他</Option>
                 <Option value="unknown">保密</Option>
             </Select>
          </Form.Item>
          
          <Form.Item name="birthday" label="生日" rules={[{ required: true, message: '请选择生日' }]}>
             <DatePicker style={{ width: '100%' }} placeholder="请选择生日" />
          </Form.Item>
          
          <Button type="primary" htmlType="submit" block loading={loading} style={{ marginBottom: 12 }}>
            注册
          </Button>
          <div style={{ textAlign: 'center' }}>
            已有账号？ <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
