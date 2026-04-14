import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { isAdminApp, isStaffApp } from '../utils/appType';
import { mainRoutes } from './mainRoutes';
import { adminRoutes } from './adminRoutes';
import { staffRoutes } from './staffRoutes';

// Load routes based on app type (determined by VITE_APP_TYPE at build time)
const routes = isAdminApp ? adminRoutes : isStaffApp ? staffRoutes : mainRoutes;

const router = createBrowserRouter(routes);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};