import React, { createContext, useState, useContext } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';

const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
    const [role, setRole] = useLocalStorage('serrallab_user_role', 'client'); // 'client' or 'admin'

    return (
        <UserRoleContext.Provider value={{ role, setRole }}>
            {children}
        </UserRoleContext.Provider>
    );
};

export const useUserRole = () => {
    const context = useContext(UserRoleContext);
    if (context === undefined) {
        throw new Error('useUserRole must be used within a UserRoleProvider');
    }
    return context;
};