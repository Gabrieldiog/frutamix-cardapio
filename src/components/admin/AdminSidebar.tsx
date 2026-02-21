'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ClipboardIcon, BoxIcon, TagIcon, UsersIcon, LayersIcon, ExternalLinkIcon, CloseIcon } from './AdminIcons';

const navItems = [
    { href: '/admin/orders', label: 'Pedidos', icon: ClipboardIcon },
    { href: '/admin/products', label: 'Produtos', icon: BoxIcon },
    { href: '/admin/categories', label: 'Categorias', icon: TagIcon },
    { href: '/admin/addons', label: 'Adicionais', icon: LayersIcon },
    { href: '/admin/users', label: 'Usuários', icon: UsersIcon },
];

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {isOpen && <div className="admin-sidebar-overlay" onClick={onClose} />}
            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-logo">
                    <Image
                        src="/logo.jpg"
                        alt="FrutaMix"
                        width={40}
                        height={40}
                        style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div className="admin-sidebar-brand">FrutaMix</div>
                        <div className="admin-sidebar-role">Admin</div>
                    </div>
                    <button className="admin-sidebar-close" onClick={onClose}>
                        <CloseIcon size={22} color="#fff" />
                    </button>
                </div>

                <nav className="admin-sidebar-nav">
                    {navItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="admin-sidebar-footer">
                    <Link href="/" className="admin-nav-item" target="_blank">
                        <ExternalLinkIcon size={20} />
                        <span>Ver Cardápio</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
