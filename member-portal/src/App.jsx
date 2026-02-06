import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tiers from './pages/Tiers';
import Points from './pages/Points';
import Coupons from './pages/Coupons';
import Orders from './pages/Orders';
import AppLayout from './components/AppLayout';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tiers" element={<Tiers />} />
          <Route path="points" element={<Points />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="orders" element={<Orders />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
