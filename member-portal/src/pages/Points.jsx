import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Tag } from 'antd';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const Points = () => {
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    setLedger(data || []);
  };

  return (
    <div>
      <Typography.Title level={4}>积分流水</Typography.Title>
      <List
        dataSource={ledger}
        renderItem={item => (
          <Card size="small" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 'bold' }}>{item.type}</div>
                <div style={{ color: item.amount > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {item.amount > 0 ? '+' : ''}{item.amount}
                </div>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
            </div>
            {item.description && <div style={{ fontSize: 13, marginTop: 4 }}>{item.description}</div>}
          </Card>
        )}
      />
    </div>
  );
};

export default Points;
