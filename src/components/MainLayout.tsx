import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';
import CitySelectorModal from './CitySelectorModal';
import Footer from './Footer';
import HomepageCouponBanner from './HomepageCouponBanner';

// Pages where the coupon banner should be hidden
const HIDE_COUPON_PATHS = ['/login', '/auth', '/profile'];

/**
 * Main site layout (scootyonrent.com)
 * Wraps all user-facing pages
 */
const MainLayout: React.FC = () => {
    const location = useLocation();
    const showCoupon = !HIDE_COUPON_PATHS.some(path => location.pathname.startsWith(path));

    return (
        <>
            <CitySelectorModal />
            <Outlet />
            <Footer />
            <WhatsAppButton />
            {showCoupon && <HomepageCouponBanner />}
        </>
    );
};

export default MainLayout;
