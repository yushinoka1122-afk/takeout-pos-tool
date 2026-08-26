export function printReceipt(cartItems, totalAmount, receivedAmount, change, paymentMethod = '現金') {
  // iPadかPCかを判定 (簡易的)
  const isPC = !/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  const now = new Date();
  const dateStr = now.toLocaleString('ja-JP');
  
  const isReturn = totalAmount < 0;
  const absTotal = Math.abs(totalAmount);
  const titleText = isReturn ? '返品明細' : '領収書';
  
  let itemsHtml = '';
  cartItems.forEach(item => {
    itemsHtml += `
      <tr>
        <td style="text-align: left;">${item.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `;
  });

  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; width: 100%; margin: 0; padding: 0; font-size: 14px; color: #000; }
          .receipt { width: 100%; max-width: 300px; margin: 0 auto; padding: 20px 0; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { border-bottom: 1px dashed #000; padding-bottom: 5px; font-weight: normal; }
          td { padding: 5px 0; }
          .totals { border-top: 1px dashed #000; padding-top: 10px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <img src="https://yushinoka1122-afk.github.io/takeout-pos/logo.png" style="width: 100%; max-width: 200px; margin-bottom: 10px;" onerror="this.style.display='none'" />
            <div class="title" style="font-size: 20px;">BAKERY CAFE C<br>神戸さんちか店</div>
            <div style="font-weight: bold; font-size: 18px; margin-top: 10px;">${titleText}</div>
            <div style="margin-top: 5px;">${dateStr}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">商品</th>
                <th style="text-align: center;">数</th>
                <th style="text-align: right;">金額</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div class="row" style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
              <span>${isReturn ? '返金合計' : '合計'}</span>
              <span>¥${absTotal.toLocaleString()}</span>
            </div>
            <div class="row" style="font-size: 12px; color: #555;">
              <span>8%対象</span>
              <span>¥${absTotal.toLocaleString()}</span>
            </div>
            <div class="row" style="font-size: 12px; color: #555; margin-bottom: 10px;">
              <span>内消費税等(8%)</span>
              <span>¥${Math.round(absTotal - (absTotal / 1.08)).toLocaleString()}</span>
            </div>
            
            ${!isReturn ? `
              <div class="row" style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <span>決済方法</span>
                <span>${paymentMethod}</span>
              </div>
              ${paymentMethod === '現金' ? `
              <div class="row">
                <span>お預かり</span>
                <span>¥${receivedAmount.toLocaleString()}</span>
              </div>
              <div class="row">
                <span>おつり</span>
                <span>¥${change.toLocaleString()}</span>
              </div>
              ` : ''}
            ` : ''}
          </div>
          <div class="footer">
            登録番号：T1234567890123<br>
            またのお越しをお待ちしております。
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
