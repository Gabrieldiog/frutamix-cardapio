'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import CategoryBar from '@/components/CategoryBar';
import ProductCard from '@/components/ProductCard';
import { Category, Product } from '@/types';
import { PlateIcon, SearchIcon, CloseIcon } from '@/components/Icons';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData.categories || []);
        setProducts(prodData.products || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const normalize = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const searchTerm = normalize(search.trim());

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    const matchesSearch = !searchTerm
      || normalize(p.name).includes(searchTerm)
      || (p.description && normalize(p.description).includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  const handleClearSearch = () => {
    setSearch('');
    searchRef.current?.focus();
  };

  return (
    <>
      <Header />
      <div className="search-bar-wrapper">
        <div className="search-bar">
          <SearchIcon size={18} color="var(--text-light)" />
          <input
            ref={searchRef}
            type="text"
            className="search-input"
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={handleClearSearch} aria-label="Limpar busca">
              <CloseIcon size={16} color="var(--text-light)" />
            </button>
          )}
        </div>
      </div>
      <CategoryBar
        categories={categories}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <div className="products-section">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <div className="loading-text">Carregando cardápio...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><PlateIcon size={48} color="var(--text-secondary)" /></div>
            <div className="empty-state-text">
              {searchTerm
                ? `Nenhum produto encontrado para "${search.trim()}"`
                : products.length === 0
                  ? 'Nenhum produto disponível no momento'
                  : 'Nenhum produto nesta categoria'}
            </div>
          </div>
        ) : (
          <>
            <div className="section-title">
              {searchTerm
                ? `Resultados para "${search.trim()}"`
                : selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name || 'Produtos'
                  : 'Todos os Produtos'}
            </div>
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <div key={product.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
