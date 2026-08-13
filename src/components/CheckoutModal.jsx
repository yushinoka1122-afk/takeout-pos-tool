import { useState } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { printReceipt } from '../utils/print';

export default function CheckoutModal({ cartItems, totalAmount, onClose, onComplete }) {
  const [step, setStep] = useState('input'); // 'input', 'processing', 'success'
  const [receivedAmountStr, setReceivedAmountStr] = useState('');
  const [change, setChange] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  
  // 入力されたお預かり金額（未入力の場合は0として扱う）
  const currentReceived = receivedAmountStr ? parseInt(receivedAmountStr, 10) : 0;
  const currentChange = currentReceived - totalAmount;
  
  // 完了可能かどうか（お預かり金額が合計を満たしているか）
  const canComplete = currentReceived >= totalAmount;

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

  const handleProcessComplete = async () => {
    setStep('processing');
    setReceivedAmount(currentReceived);
    setChange(currentChange);
    
    // App.jsxのonCompleteを呼び出してGASへ送信
    const success = await onComplete({ receivedAmount: currentReceived, change: currentChange });
    
    if (success) {
      setStep('success');
    } else {
      // エラー時は元の入力画面に戻る
      setStep('input');
    }
  };

  const handlePrint = () => {
    printReceipt(cartItems, totalAmount, receivedAmount, change);
  };

  // ----- 成功画面のレンダリング -----
  if (step === 'success') {
    return (
      <div className="modal-overlay">
        <div className="checkout-modal success-modal" style={{textAlign: 'center', maxWidth: '400px'}}>
          <div style={{color: 'var(--success)', marginBottom: '20px'}}>
            <CheckCircle2 size={64} style={{margin: '0 auto'}} />
          </div>
          <h2 style={{fontSize: '1.8rem', marginBottom: '10px'}}>会計完了！</h2>
          
          <div style={{background: 'var(--bg)', padding: '20px', borderRadius: '12px', marginBottom: '30px'}}>
            <div style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>おつり</div>
            <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)'}}>
              ¥{change.toLocaleString()}
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <button className="btn btn-outline" onClick={handlePrint} style={{padding: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderColor: '#333', color: '#333'}}>
              <Printer size={24} />
              レシートを印刷
            </button>
            
            <button className="btn btn-primary" onClick={() => onClose(true)} style={{padding: '16px', fontSize: '1.2rem'}}>
              次のお会計へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- 入力画面のレンダリング -----
  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        <button className="modal-close" onClick={() => onClose(false)} disabled={step === 'processing'}><X size={28} /></button>
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
                {receivedAmountStr === '' ? '¥ 0' : `¥ ${currentReceived.toLocaleString()}`}
              </span>
            </div>
            
            <div className="amount-row highlight">
              <span className="amount-label">おつり</span>
              <span className={`amount-value change ${currentChange >= 0 && receivedAmountStr !== '' ? 'positive' : 'negative'}`}>
                {receivedAmountStr === '' ? '¥ -' : `¥ ${Math.max(0, currentChange).toLocaleString()}`}
              </span>
            </div>
            
            <button 
              className="btn btn-primary complete-btn" 
              disabled={!canComplete || step === 'processing'}
              onClick={handleProcessComplete}
            >
              {step === 'processing' ? '通信中...' : '会計完了'}
            </button>
          </div>
          
          {/* 右側：テンキーエリア */}
          <div className="checkout-right" style={{opacity: step === 'processing' ? 0.5 : 1, pointerEvents: step === 'processing' ? 'none' : 'auto'}}>
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
