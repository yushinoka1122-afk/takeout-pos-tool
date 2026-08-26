export function printReceipt(cartItems, totalAmount, receivedAmount, change, paymentMethod = '現金') {
  // iPadかPCかを判定 (簡易的)
  const isPC = !/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  const now = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dateStr = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日(${days[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const isReturn = totalAmount < 0;
  const absTotal = Math.abs(totalAmount);
  
  let itemsHtml = '';
  let totalQuantity = 0;
  cartItems.forEach(item => {
    const qty = Math.abs(item.quantity);
    totalQuantity += qty;
    
    // 全てテイクアウト（8%）想定なので「※」をつける
    if (qty === 1) {
      itemsHtml += `
        <div class="row">
          <span>※${item.name}</span>
          <span>¥${item.price.toLocaleString()}内</span>
        </div>
      `;
    } else {
      itemsHtml += `
        <div class="item-name">※${item.name}</div>
        <div class="row item-details">
          <span>&nbsp;&nbsp;単${item.price.toLocaleString()} × ${qty}点</span>
          <span>¥${(item.price * qty).toLocaleString()}内</span>
        </div>
      `;
    }
  });

  const tax = Math.round(absTotal - (absTotal / 1.08));
  const subtotal = absTotal;
  const transactionNo = Math.floor(Math.random() * 90000) + 10000;

  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: monospace, sans-serif; width: 100%; margin: 0; padding: 0; font-size: 14px; color: #000; line-height: 1.4; }
          .receipt { width: 100%; max-width: 300px; margin: 0 auto; padding: 20px 10px; }
          .header { text-align: center; margin-bottom: 15px; }
          .title { font-size: 18px; margin-bottom: 5px; letter-spacing: 2px; }
          .store-info { font-size: 12px; text-align: center; line-height: 1.3; margin-bottom: 15px; }
          .date-line { font-size: 13px; margin-bottom: 10px; }
          
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .items-list { margin-bottom: 15px; }
          .item-name { margin-bottom: 0px; }
          .item-details { color: #000; font-size: 13px; }
          
          .totals-section { margin-bottom: 15px; font-size: 13px; }
          .total-row { font-size: 18px; letter-spacing: 2px; margin: 8px 0; }
          .tax-details { font-size: 12px; display: flex; justify-content: space-between; }
          .tax-details span { display: inline-block; }
          
          .payment-section { margin-top: 15px; margin-bottom: 20px; font-size: 14px; }
          .footer-info { font-size: 12px; }
          
          /* Utility */
          .w-50 { width: 50px; text-align: right; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <img src="https://yushinoka1122-afk.github.io/takeout-pos/logo.png" style="width: 100%; max-width: 120px; margin-bottom: 5px;" onerror="this.style.display='none'" />
            <div class="title">BAKERY<br>CAFE C</div>
          </div>
          
          <div class="store-info">
            ベーカリーカフェC さんちか店<br>
            神戸市中央区三宮町１−１０−１<br>
            さんちか10番街グルメスクエア<br>
            TEL:
          </div>
          
          ${isReturn ? '<div style="text-align:center; font-size: 16px; margin-bottom:10px;">＜ 返品明細 ＞</div>' : ''}
          
          <div class="date-line">${dateStr}</div>
          
          <div class="items-list">
            ${itemsHtml}
          </div>
          
          <div class="totals-section">
            <div class="row">
              <span style="padding-left: 20px;">外税</span>
              <span>¥0</span>
            </div>
            <div class="row">
              <span style="padding-left: 20px;">小計</span>
              <span>¥${subtotal.toLocaleString()}</span>
            </div>
            
            <div class="row total-row">
              <span>合 計</span>
              <span>¥${absTotal.toLocaleString()}</span>
            </div>
            
            <div class="row tax-details">
              <span>(内消費税</span>
              <span>¥${tax.toLocaleString()})</span>
            </div>
            <div class="row tax-details">
              <span>( 10%対象<span class="w-50">¥0</span></span>
              <span>消費税<span class="w-50">¥0</span>)</span>
            </div>
            <div class="row tax-details">
              <span>(  8%対象<span class="w-50">¥${subtotal.toLocaleString()}</span></span>
              <span>消費税<span class="w-50">¥${tax.toLocaleString()}</span>)</span>
            </div>
            
            <div style="margin-top: 5px; font-size: 12px;">※印は軽減税率適用商品</div>
          </div>
          
          <div class="payment-section">
            ${!isReturn ? `
              ${paymentMethod === '現金' ? `
                <div class="row">
                  <span>お預り合計</span>
                  <span>¥${receivedAmount.toLocaleString()}</span>
                </div>
                <div class="row">
                  <span>おつり</span>
                  <span>¥${change.toLocaleString()}</span>
                </div>
              ` : `
                <div class="row">
                  <span>お預り合計(${paymentMethod})</span>
                  <span>¥${receivedAmount.toLocaleString()}</span>
                </div>
              `}
            ` : `
              <div class="row">
                <span>返金合計</span>
                <span>¥${absTotal.toLocaleString()}</span>
              </div>
            `}
          </div>
          
          <div class="footer-info">
            <div style="text-align: right; margin-bottom: 5px;">担当:BAKERY CAFE C</div>
            <div class="row">
              <span>端末1 取引No.${transactionNo}</span>
              <span>${totalQuantity}点</span>
            </div>
            <div style="text-align: right; margin-top: 5px;">登録番号:T4260001004499</div>
          </div>
        </div>
      </body>
    </html>
  `;

  if (isPC) {
    // PCの場合は隠しiframeを作って印刷（ポップアップブロック対策）
    let printIframe = document.getElementById('print-iframe');
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'print-iframe';
      printIframe.style.position = 'absolute';
      printIframe.style.width = '0px';
      printIframe.style.height = '0px';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);
    }
    
    const iframeDoc = printIframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    // 確実にレンダリングさせるため少し待ってから印刷ダイアログを呼び出す
    setTimeout(() => {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
    }, 250);
  } else {
    // iPadの場合はPassPRNTを呼び出す
    const currentUrl = window.location.href.split('?')[0]; // クエリパラメータを除外
    // size=384 (2inch/58mm), size=576 (3inch/80mm) ※最新のAPI仕様に合わせてドット数で指定
    const passPrntUrl = `starpassprnt://v1/print/nopreview?html=${encodeURIComponent(html)}&size=384&back=${encodeURIComponent(currentUrl)}`;
    window.location.href = passPrntUrl;
  }
}
