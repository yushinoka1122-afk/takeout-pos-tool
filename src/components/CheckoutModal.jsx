import { useState } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { printReceipt } from '../utils/print';

const PAYMENT_METHODS = [
  '現金',
  'クレジットカード',
  'QRコード決済',
  '交通系IC',
  'iD',
  'QUICPay',
  'PiTaPa'
];

export default function CheckoutModal({ cartItems, totalAmount, onClose, onComplete }) {
  const [step, setStep] = useState('input'); // 'input', 'processing', 'success'
  const [receivedAmountStr, setReceivedAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('現金');
  const [change, setChange] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  
  const isReturn = totalAmount < 0;
  const isCashless = paymentMethod !== '現金';
  
  // 入力されたお預かり金額（未入力の場合は0として扱う）
  // 返品モードまたはキャッシュレス決済の場合は自動的に合計金額をお預かりとする（おつり0）
  const currentReceived = (isReturn || isCashless) ? Math.max(0, totalAmount) : (receivedAmountStr ? parseInt(receivedAmountStr, 10) : 0);
  const currentChange = (isReturn || isCashless) ? 0 : currentReceived - totalAmount;
  
  // 完了可能かどうか
  // キャッシュレス・返品の場合は常に完了可能。現金の場合は合計金額以上預かっているか。
  const canComplete = (isReturn || isCashless) ? true : currentReceived >= totalAmount;

  // テンキー入力処理
  const handleNumpadClick = (num) => {
    if (isReturn || isCashless) return; // テンキー無効化
    if (receivedAmountStr === '0' && num === '0') return;
    if (receivedAmountStr === '0' && num !== '00') {
      setReceivedAmountStr(num);
    } else {
      // 桁数を制限（最大7桁）
      setReceivedAmountStr(prev => (prev + num).slice(0, 7));
    }
  };

  const handleClear = () => {
    if (isReturn || isCashless) return;
    setReceivedAmountStr('');
  };
  
  const handleShortcut = (amount) => {
    if (isReturn || isCashless) return;
    setReceivedAmountStr(amount.toString());
  };

  const handleProcessComplete = async () => {
    setStep('processing');
    
    const finalReceived = (isReturn || isCashless) ? totalAmount : currentReceived;
    const finalChange = isReturn ? 0 : currentChange;
    
    setReceivedAmount(finalReceived);
    setChange(finalChange);
    
    // App.jsxのonCompleteを呼び出してGASへ送信
    const success = await onComplete({ 
      receivedAmount: finalReceived, 
      change: finalChange,
      paymentMethod: paymentMethod
    });
    
    if (success) {
      setStep('success');
    } else {
      // エラー時は元の入力画面に戻る
      setStep('input');
    }
  };

  const handlePrint = () => {
    printReceipt(cartItems, totalAmount, receivedAmount, change, paymentMethod);
  };

  // ----- 成功画面のレンダリング -----
  if (step === 'success') {
    return (
      <div className="modal-overlay">
        <div className="checkout-modal success-modal" style={{textAlign: 'center', maxWidth: '400px'}}>
          <div style={{color: 'var(--success)', marginBottom: '20px'}}>
            <CheckCircle2 size={64} style={{margin: '0 auto'}} />
          </div>
          <h2 style={{fontSize: '1.8rem', marginBottom: '10px'}}>
            {isReturn ? '返品完了！' : '会計完了！'}
          </h2>
          
          {!isReturn && (
            <div style={{background: 'var(--bg)', padding: '20px', borderRadius: '12px', marginBottom: '30px'}}>
              <div style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>{isCashless ? '決済方法' : 'おつり'}</div>
              <div style={{fontSize: isCashless ? '2rem' : '3rem', fontWeight: 'bold', color: 'var(--primary)'}}>
                {isCashless ? paymentMethod : `¥${change.toLocaleString()}`}
              </div>
            </div>
          )}
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <button className="btn btn-outline" onClick={handlePrint} style={{padding: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderColor: '#333', color: '#333'}}>
              <Printer size={24} />
              レシートを印刷
            </button>
            
            <button className="btn btn-primary" onClick={() => onClose(true)} style={{padding: '16px', fontSize: '1.2rem'}}>
              {isReturn ? '閉じる' : '次のお会計へ'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- 入力画面のレンダリング -----
  return (
    <div className="modal-overlay">
      <div className="checkout-modal" style={{maxWidth: '800px', width: '95%'}}>
        <button className="modal-close" onClick={() => onClose(false)} disabled={step === 'processing'}><X size={28} /></button>
        <h2 className="modal-title">{isReturn ? '返品確認' : 'お会計'}</h2>
        
        <div className="checkout-content">
          {/* 左側：決済方法と金額エリア */}
          <div className="checkout-left" style={{flex: 1.5}}>
            
            {!isReturn && (
              <div style={{marginBottom: '20px'}}>
                <div style={{fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px'}}>決済方法</div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        padding: '10px',
                        border: '2px solid',
                        borderColor: paymentMethod === method ? 'var(--primary)' : '#ddd',
                        backgroundColor: paymentMethod === method ? 'rgba(0,102,204,0.1)' : '#fff',
                        color: paymentMethod === method ? 'var(--primary)' : '#333',
                        borderRadius: '8px',
                        fontWeight: paymentMethod === method ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="amount-row">
              <span className="amount-label">{isReturn ? '返金合計' : '合計金額'}</span>
              <span className="amount-value total">¥{Math.abs(totalAmount).toLocaleString()}</span>
            </div>
            
            {!isReturn && paymentMethod === '現金' && (
              <>
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
              </>
            )}
            
            <button 
              className="btn btn-primary complete-btn" 
              disabled={!canComplete || step === 'processing'}
              onClick={handleProcessComplete}
              style={{marginTop: '20px', backgroundColor: isReturn ? 'var(--danger)' : 'var(--primary)'}}
            >
              {step === 'processing' ? '通信中...' : (isReturn ? '返品を確定する' : `${paymentMethod}で会計完了`)}
            </button>
          </div>
          
          {/* 右側：テンキーエリア（現金かつ通常会計のみ有効） */}
          <div className="checkout-right" style={{
            opacity: (step === 'processing' || isReturn || isCashless) ? 0.3 : 1, 
            pointerEvents: (step === 'processing' || isReturn || isCashless) ? 'none' : 'auto',
            flex: 1
          }}>
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
