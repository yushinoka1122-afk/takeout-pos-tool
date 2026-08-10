import { Trash2, Plus, Minus, CreditCard } from 'lucide-react';

export default function Cart({ cartItems, onUpdateQuantity, onCheckout }) {
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="cart-sidebar">
      <div className="cart-header">
        <h2 className="cart-title">現在の注文</h2>
      </div>
      
      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            カートは空です。<br/>左側から商品を選択してください。
          </div>
        ) : (
          cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">¥{item.price.toLocaleString()}</div>
              </div>
              <div className="cart-item-controls">
                <button 
                  className="qty-btn" 
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  {item.quantity <= 1 ? <Trash2 size={20} color="var(--danger)" /> : <Minus size={20} />}
                </button>
                <span className="cart-item-qty">{item.quantity}</span>
                <button 
                  className="qty-btn" 
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="cart-footer">
        <div className="cart-total">
          <span>合計</span>
          <span>¥{totalAmount.toLocaleString()}</span>
        </div>
        <button 
          className="btn btn-primary checkout-btn" 
          disabled={cartItems.length === 0}
          onClick={onCheckout}
        >
          <CreditCard size={28} />
          お会計へ進む
        </button>
      </div>
    </div>
  );
}
