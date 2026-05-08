import React from 'react';
import { Outlet } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import CitySelectorModal from './CitySelectorModal';
import Footer from './Footer';
import HomepageCouponBanner from './HomepageCouponBanner';

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
            <HomepageCouponBanner />
        </>
    );
};

export default MainLayout;
