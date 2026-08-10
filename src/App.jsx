import { useState, useEffect } from 'react';
import Settings from './components/Settings';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import { sendSalesDataToGAS, fetchMenuDataFromGAS } from './utils/gas';
import CheckoutModal from './components/CheckoutModal';
import { Settings as SettingsIcon } from 'lucide-react';

function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    // ローカルストレージから一時的に読み込む（オフライン時や高速表示のため）
    const savedProducts = localStorage.getItem('pos_products');
    let hasLocalData = false;
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
        hasLocalData = true;
      } catch (e) {
        console.error('商品のパースに失敗しました', e);
      }
    }

    // クラウド（スプレッドシート）から最新メニューを自動同期する
    const syncMenu = async () => {
      const gasData = await fetchMenuDataFromGAS();
      if (gasData && gasData.length > 0) {
        setProducts(gasData);
        localStorage.setItem('pos_products', JSON.stringify(gasData));
      } else if (!hasLocalData) {
        // データがどこにも無い場合は設定画面を開く
        setIsSettingsOpen(true);
      }
    };
    
    syncMenu();
  }, []);

  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutComplete = async ({ receivedAmount, change }) => {
    setIsCheckoutModalOpen(false);
    setIsCheckingOut(true);

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const now = new Date();
    const orderData = {
      timestamp: now.toISOString(),
      dateStr: now.toLocaleDateString('ja-JP'), // "2026/7/31" のような形式
      items: cartItems.map(i => `${i.name} x${i.quantity}`).join(', '), // レシート用
      itemsArray: cartItems.map(i => ({ name: i.name, quantity: i.quantity })), // マトリックス集計用
      totalAmount: totalAmount,
      receivedAmount: receivedAmount,
      change: change
    };

    const success = await sendSalesDataToGAS(orderData);
    
    setIsCheckingOut(false);
    if (success) {
      // カートをクリア
      setCartItems([]);
      alert(`会計完了！\nおつり: ¥${change.toLocaleString()}`);
    } else {
      alert('通信エラーが発生しました。設定を確認してください。');
    }
  };

  if (isSettingsOpen) {
    return (
      <Settings 
        onSave={(newProducts) => {
          setProducts(newProducts);
          setIsSettingsOpen(false);
        }}
        onBack={() => setIsSettingsOpen(false)}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="main-area">
        <header className="header">
          <div className="header-title">Takeout POS</div>
          <button 
            className="btn btn-outline" 
            onClick={() => setIsSettingsOpen(true)}
            style={{padding: '8px 16px', fontSize: '1rem'}}
          >
            <SettingsIcon size={20} />
            設定
          </button>
        </header>
        
        {products.length === 0 ? (
          <div style={{padding: '40px', textAlign: 'center'}}>
            <h2>商品が登録されていません</h2>
            <p style={{color: 'var(--text-muted)'}}>右上の設定ボタンからCSVをアップロードしてください。</p>
          </div>
        ) : (
          <ProductGrid 
            products={products} 
            onAddToCart={handleAddToCart} 
          />
        )}
      </div>
      
      <Cart 
        cartItems={cartItems} 
        onUpdateQuantity={handleUpdateQuantity} 
        onCheckout={handleCheckoutClick} 
      />
      
      {isCheckoutModalOpen && (
        <CheckoutModal 
          totalAmount={cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
          onClose={() => setIsCheckoutModalOpen(false)}
          onComplete={handleCheckoutComplete}
        />
      )}

      {isCheckingOut && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{background: 'white', padding: '40px', borderRadius: '16px', fontSize: '1.5rem', fontWeight: 'bold'}}>
            通信中...
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
