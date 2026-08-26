import { useState, useMemo } from 'react';

export default function ProductGrid({ products, onAddToCart }) {
  const [activeCategory, setActiveCategory] = useState('');

  // カテゴリ一覧を抽出
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    if (cats.length > 0 && !activeCategory) {
      setActiveCategory(cats[0]);
    }
    return cats;
  }, [products, activeCategory]);

  const filteredProducts = products.filter(p => p.category === activeCategory);

  return (
    <div className="main-area">
      <div className="categories">
        {categories.map(cat => (
          <button 
            key={cat}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="product-grid">
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            className="product-card"
            onClick={() => onAddToCart(product)}
          >
            <div className="product-image">
              {(() => {
                const localImg = localStorage.getItem('pos_img_' + product.name);
                const imgSrc = localImg || product.image;
                if (imgSrc) {
                  return <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex';}} />
                }
                return null;
              })()}
              <span style={{ display: localStorage.getItem('pos_img_' + product.name) || product.image ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>No Image</span>
            </div>
            <div className="product-info">
              <div className="product-category">{product.category}</div>
              <div className="product-name">{product.name}</div>
              <div className="product-price">¥{(product.price || 0).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
