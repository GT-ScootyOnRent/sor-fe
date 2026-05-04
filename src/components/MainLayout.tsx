import React from 'react';
import { Outlet } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import CitySelectorModal from './CitySelectorModal';
import Footer from './Footer';

/**
 * Main site layout (scootyonrent.com)
 * Wraps all user-facing pages
 */
const MainLayout: React.FC = () => {
    return (
        <>
            <CitySelectorModal />
            <Outlet />
            <Footer />
            <WhatsAppButton />
        </>
    );
};

export default MainLayout;
