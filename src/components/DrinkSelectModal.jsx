import { X, Coffee } from 'lucide-react';

const DRINKS = [
  { name: 'ホットコーヒーS', extraPrice: 0 },
  { name: 'ホットティー', extraPrice: 0 },
  { name: 'アイスコーヒー', extraPrice: 0 },
  { name: 'アイスティー', extraPrice: 0 },
  { name: 'カフェラテ', extraPrice: 110 }
];

export default function DrinkSelectModal({ product, onSelect, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="checkout-modal" style={{ maxWidth: '500px', width: '90%' }}>
        <button className="modal-close" onClick={onClose}><X size={28} /></button>
        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Coffee size={24} />
          セットドリンクの選択
        </h2>
        
        <div style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          「{product.name}」のドリンクを選んでください。
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {DRINKS.map((drink) => (
            <button
              key={drink.name}
              onClick={() => onSelect(drink)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                fontSize: '1.2rem',
                backgroundColor: '#fff',
                border: '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'rgba(0,102,204,0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#333' }}>{drink.name}</span>
              {drink.extraPrice > 0 ? (
                <span style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: 'white', 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  +¥{drink.extraPrice}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>追加料金なし</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
