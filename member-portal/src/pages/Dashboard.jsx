import React, { useEffect, useState } from 'react';
import { Avatar, Card, Statistic, Button, Row, Col, Tag, message } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        navigate('/login');
        return;
    }
    
    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (profileError) {
        console.error('Fetch profile error:', profileError);
        message.error('加载会员信息失败: ' + profileError.message);
        setProfile({}); // Stop loading
        return;
    }

    // 2. Fetch Tier Info (Manually join)
    let tierName = '普通会员';
    if (profileData.current_tier_id) {
        const { data: tierData } = await supabase
            .from('membership_tiers')
            .select('name')
            .eq('id', profileData.current_tier_id)
            .single();
        if (tierData) {
            tierName = tierData.name;
        }
    }

    setProfile({
        ...profileData,
        membership_tiers: { name: tierName }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!profile) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Avatar size={64} icon={<UserOutlined />} src={profile.avatar_url} />
        <div style={{ marginLeft: 16 }}>
            <h2 style={{ margin: 0 }}>{profile.nickname || '会员'}</h2>
            <div style={{ marginTop: 4 }}>
                <Tag color="gold">{profile.membership_tiers?.name || '普通会员'}</Tag>
            </div>
        </div>
        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ marginLeft: 'auto' }} />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic title="当前积分" value={profile.current_points} />
          </Col>
          <Col span={12}>
            <Statistic title="余额" value={profile.balance} precision={2} prefix="¥" />
          </Col>
        </Row>
      </Card>
      
      <Card title="会员码" size="small">
        <div style={{ textAlign: 'center', padding: 20, background: '#f0f0f0', borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 4 }}>
                {profile.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : 'NO PHONE'}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>向店员出示以积分享受权益</div>
        </div>
      </Card>
    </div>
  );
};
export default Dashboard;
