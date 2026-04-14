import React from 'react';
import { Outlet } from 'react-router-dom';
import  WhatsAppButton  from './WhatsAppButton';

const UserLayout: React.FC = () => {
  return (
    <>
      <Outlet />
      <WhatsAppButton />
    </>
  );
};

export default UserLayout;
