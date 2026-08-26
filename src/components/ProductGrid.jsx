import { useState, useMemo } from 'react';

export default function ProductGrid({ products, onAddToCart }) {
  const [activeCategory, setActiveCategory] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [soldOutItems, setSoldOutItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_soldout_items') || '[]');
    } catch (e) {
      return [];
    }
  });

  // カテゴリ一覧を抽出
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    if (cats.length > 0 && !activeCategory) {
      setActiveCategory(cats[0]);
    }
    return cats;
  }, [products, activeCategory]);

  const filteredProducts = products.filter(p => p.category === activeCategory);

  const handleProductClick = (product) => {
    if (isEditMode) {
      const newSoldOut = soldOutItems.includes(product.id)
        ? soldOutItems.filter(id => id !== product.id)
        : [...soldOutItems, product.id];
      setSoldOutItems(newSoldOut);
      localStorage.setItem('pos_soldout_items', JSON.stringify(newSoldOut));
    } else {
      if (soldOutItems.includes(product.id)) return; // prevent adding sold out
      onAddToCart(product);
    }
  };

  return (
    <div className="main-area" style={{display: 'flex', flexDirection: 'column'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px'}}>
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
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          style={{
            padding: '8px 16px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: isEditMode ? 'var(--danger)' : '#64748b', 
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {isEditMode ? '売切設定 終了' : '売切設定'}
        </button>
      </div>

      <div className="product-grid" style={{flex: 1, overflowY: 'auto'}}>
        {filteredProducts.map(product => {
          const isSoldOut = soldOutItems.includes(product.id);
          return (
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => handleProductClick(product)}
              style={{
                position: 'relative',
                opacity: isSoldOut ? 0.5 : 1,
                cursor: (isSoldOut && !isEditMode) ? 'not-allowed' : 'pointer',
                border: (isEditMode && isSoldOut) ? '2px solid var(--danger)' : ''
              }}
            >
              {isSoldOut && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px', 
                  backgroundColor: 'var(--danger)', color: 'white', 
                  padding: '4px 8px', borderRadius: '4px', 
                  fontWeight: 'bold', fontSize: '0.8rem', zIndex: 10
                }}>
                  SOLD OUT
                </div>
              )}
              {isEditMode && (
                <div style={{
                  position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5
                }}>
                  <div style={{
                    backgroundColor: isSoldOut ? 'white' : 'var(--danger)', 
                    color: isSoldOut ? 'var(--danger)' : 'white',
                    padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold'
                  }}>
                    {isSoldOut ? '売切を解除' : '売切にする'}
                  </div>
                </div>
              )}
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
          );
        })}
      </div>
    </div>
  );
}
