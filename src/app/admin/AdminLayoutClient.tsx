'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import './admin.css';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
        return <div className="admin-loading">Carregando...</div>;
    }

    // Login page - no sidebar/header
    if (!user) {
        return <>{children}</>;
    }

    return (
        <div className="admin-layout">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="admin-main">
                <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div className="admin-content">{children}</div>
            </div>
        </div>
    );
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </AuthProvider>
    );
}
