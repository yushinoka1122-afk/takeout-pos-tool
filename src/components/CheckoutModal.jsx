import { useState } from 'react';
import { X } from 'lucide-react';

export default function CheckoutModal({ totalAmount, onClose, onComplete }) {
  const [receivedAmountStr, setReceivedAmountStr] = useState('');
  
  // 入力されたお預かり金額（未入力の場合は0として扱う）
  const receivedAmount = receivedAmountStr ? parseInt(receivedAmountStr, 10) : 0;
  
  // おつり計算
  const change = receivedAmount - totalAmount;
  
  // 完了可能かどうか（お預かり金額が合計を満たしているか）
  const canComplete = receivedAmount >= totalAmount;

  // テンキー入力処理
  const handleNumpadClick = (num) => {
    if (receivedAmountStr === '0' && num === '0') return;
    if (receivedAmountStr === '0' && num !== '00') {
      setReceivedAmountStr(num);
    } else {
      // 桁数を制限（最大7桁）
      setReceivedAmountStr(prev => (prev + num).slice(0, 7));
    }
  };

  const handleClear = () => setReceivedAmountStr('');
  
  const handleShortcut = (amount) => setReceivedAmountStr(amount.toString());

  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        <button className="modal-close" onClick={onClose}><X size={28} /></button>
        <h2 className="modal-title">お会計</h2>
        
        <div className="checkout-content">
          {/* 左側：金額表示エリア */}
          <div className="checkout-left">
            <div className="amount-row">
              <span className="amount-label">合計金額</span>
              <span className="amount-value total">¥{totalAmount.toLocaleString()}</span>
            </div>
            
            <div className="amount-row">
              <span className="amount-label">お預かり</span>
              <span className={`amount-value received ${receivedAmountStr === '' ? 'empty' : ''}`}>
                {receivedAmountStr === '' ? '¥ 0' : `¥ ${receivedAmount.toLocaleString()}`}
              </span>
            </div>
            
            <div className="amount-row highlight">
              <span className="amount-label">おつり</span>
              <span className={`amount-value change ${change >= 0 && receivedAmountStr !== '' ? 'positive' : 'negative'}`}>
                {receivedAmountStr === '' ? '¥ -' : `¥ ${Math.max(0, change).toLocaleString()}`}
              </span>
            </div>
            
            <button 
              className="btn btn-primary complete-btn" 
              disabled={!canComplete}
              onClick={() => onComplete({ receivedAmount, change })}
            >
              会計完了
            </button>
          </div>
          
          {/* 右側：テンキーエリア */}
          <div className="checkout-right">
            <div className="shortcuts">
              <button className="shortcut-btn" onClick={() => handleShortcut(totalAmount)}>ちょうど</button>
              <button className="shortcut-btn" onClick={() => handleShortcut(1000)}>¥1,000</button>
              <button className="shortcut-btn" onClick={() => handleShortcut(5000)}>¥5,000</button>
              <button className="shortcut-btn" onClick={() => handleShortcut(10000)}>¥10,000</button>
            </div>
            <div className="numpad">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00'].map(num => (
                <button key={num} className="numpad-btn" onClick={() => handleNumpadClick(num)}>{num}</button>
              ))}
              <button className="numpad-btn action-btn" onClick={handleClear}>C</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
