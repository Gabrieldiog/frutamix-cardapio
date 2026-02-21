'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogoutIcon, MenuIcon } from './AdminIcons';

interface AdminHeaderProps {
    onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
    const { user, signOut } = useAuth();

    return (
        <header className="admin-header">
            <button className="admin-menu-toggle" onClick={onMenuToggle}>
                <MenuIcon size={24} />
            </button>
            <div className="admin-header-user">
                <span className="admin-header-email">{user?.email}</span>
                <button className="admin-header-logout" onClick={signOut}>
                    <LogoutIcon size={18} />
                    <span>Sair</span>
                </button>
            </div>
        </header>
    );
}
