'use client';

import { Category } from '@/types';

interface CategoryBarProps {
    categories: Category[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export default function CategoryBar({ categories, selectedId, onSelect }: CategoryBarProps) {
    return (
        <div className="category-bar">
            <button
                className={`category-chip ${selectedId === null ? 'active' : ''}`}
                onClick={() => onSelect(null)}
            >
                Todos
            </button>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    className={`category-chip ${selectedId === cat.id ? 'active' : ''}`}
                    onClick={() => onSelect(cat.id)}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
