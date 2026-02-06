import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Button, Tabs, message } from 'antd';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const Coupons = () => {
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [myCoupons, setMyCoupons] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Fetch Available (Marketplace)
    // Logic: Active, remaining > 0, end_time > now
    const { data: market } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gt('remaining_quantity', 0)
        .gt('end_time', new Date().toISOString());
    setAvailableCoupons(market || []);

    // 2. Fetch My Coupons
    if (user) {
        const { data: mine } = await supabase
            .from('user_coupons')
            .select('*, coupons(*)')
            .eq('user_id', user.id)
            .order('obtained_at', { ascending: false });
        setMyCoupons(mine || []);
    }
  };

  const handleClaim = async (couponId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // TODO: Ideally use a Database Function to handle transaction (check qty -> decrement -> insert)
    // For now, client-side simulation (not race-condition safe)
    
    const { data: coupon } = await supabase.from('coupons').select('*').eq('id', couponId).single();
    if (!coupon || coupon.remaining_quantity <= 0) {
        message.error('优惠券已领完');
        return;
    }

    // Insert user_coupon
    const { error: insertError } = await supabase.from('user_coupons').insert({
        user_id: user.id,
        coupon_id: couponId,
        expires_at: coupon.end_time // Simplified
    });

    if (insertError) {
        message.error('领取失败: ' + insertError.message);
    } else {
        // Decrement qty
        await supabase.from('coupons').update({ remaining_quantity: coupon.remaining_quantity - 1 }).eq('id', couponId);
        message.success('领取成功');
        fetchData();
    }
  };

  const renderCoupon = (item, isMine = false) => {
     const coupon = isMine ? item.coupons : item;
     return (
        <Card size="small" style={{ marginBottom: 8, background: isMine ? '#fff' : '#fff7e6', borderColor: isMine ? '#eee' : '#ffd591' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{coupon.name}</div>
                    <div style={{ color: '#f5222d' }}>
                        {coupon.type === 'amount_off' ? `¥${coupon.value}` : `${coupon.value * 10}折`}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                        满 {coupon.min_spend} 可用
                    </div>
                </div>
                <div>
                    {isMine ? (
                        <div style={{ color: item.status === 'unused' ? 'green' : 'gray' }}>
                            {item.status === 'unused' ? '未使用' : item.status === 'used' ? '已使用' : '已过期'}
                        </div>
                    ) : (
                        <Button type="primary" size="small" onClick={() => handleClaim(coupon.id)}>领取</Button>
                    )}
                </div>
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                有效期至: {dayjs(isMine ? item.expires_at : coupon.end_time).format('YYYY-MM-DD')}
            </div>
        </Card>
     );
  };

  return (
    <div>
      <Typography.Title level={4}>优惠券</Typography.Title>
      <Tabs defaultActiveKey="1" items={[
          {
              key: '1',
              label: '领券中心',
              children: <List dataSource={availableCoupons} renderItem={item => renderCoupon(item, false)} />
          },
          {
              key: '2',
              label: '我的卡包',
              children: <List dataSource={myCoupons} renderItem={item => renderCoupon(item, true)} />
          }
      ]} />
    </div>
  );
};

export default Coupons;
