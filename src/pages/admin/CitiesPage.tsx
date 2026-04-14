import React from 'react';
import CitiesManagementTab from '../../components/superadmin/CitiesManagementTab';

/**
 * Cities management page for SuperAdmin
 * Allows CRUD operations on cities with isActive and isComingSoon flags
 */
const CitiesPage: React.FC = () => {
    return (
        <div className="p-6">
            <CitiesManagementTab />
        </div>
    );
};

export default CitiesPage;
