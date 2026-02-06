import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Progress } from 'antd';
import { supabase } from '../lib/supabase';

const Tiers = () => {
  const [tiers, setTiers] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: tiersData } = await supabase.from('membership_tiers').select('*').order('level');
    setTiers(tiersData || []);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
    }
  };

  return (
    <div>
      <Typography.Title level={4}>会员等级</Typography.Title>
      
      {profile && (
          <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', color: '#fff' }}>
              <div>当前成长值: {profile.total_growth_value}</div>
              {/* Find next tier */}
              {(() => {
                  const currentTier = tiers.find(t => t.id === profile.current_tier_id) || { level: 0 };
                  const nextTier = tiers.find(t => t.level > currentTier.level);
                  if (nextTier) {
                      const percent = Math.min(100, (profile.total_growth_value / nextTier.required_growth_value) * 100);
                      return (
                          <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 12, marginBottom: 4 }}>距离 {nextTier.name} 还需 {nextTier.required_growth_value - profile.total_growth_value} 成长值</div>
                              <Progress percent={percent} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" />
                          </div>
                      )
                  }
                  return <div style={{ marginTop: 8 }}>已达到最高等级</div>
              })()}
          </Card>
      )}

      <List
        dataSource={tiers}
        renderItem={item => (
          <Card size="small" style={{ marginBottom: 8 }} title={item.name} extra={`Lv.${item.level}`}>
            <div>所需成长值: {item.required_growth_value}</div>
            <div>折扣: {item.discount_rate * 10}折</div>
            <div>积分倍率: {item.points_ratio}x</div>
            {/* Parse benefits jsonb if needed */}
          </Card>
        )}
      />
    </div>
  );
};

export default Tiers;
