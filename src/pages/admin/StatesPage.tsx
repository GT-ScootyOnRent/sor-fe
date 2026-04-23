import React from 'react';
import StatesManagementTab from '../../components/superadmin/StatesManagementTab';

/**
 * States management page for SuperAdmin
 * Allows CRUD operations on states with isActive flag
 */
const StatesPage: React.FC = () => {
    return (
        <div className="p-6">
            <StatesManagementTab />
        </div>
    );
};

export default StatesPage;
