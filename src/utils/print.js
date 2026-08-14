export function printReceipt(cartItems, totalAmount, receivedAmount, change) {
  // iPadかPCかを判定 (簡易的)
  const isPC = !/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  const now = new Date();
  const dateStr = now.toLocaleString('ja-JP');
  
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
            <div class="title" style="font-size: 20px;">BAKERY CAFE C<br>神戸さんちか店</div>
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
              <span>合計</span>
              <span>¥${totalAmount.toLocaleString()}</span>
            </div>
            <div class="row">
              <span>お預かり</span>
              <span>¥${receivedAmount.toLocaleString()}</span>
            </div>
            <div class="row">
              <span>おつり</span>
              <span>¥${change.toLocaleString()}</span>
            </div>
          </div>
          <div class="footer">
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
    // size=2 (2inch/58mm), size=3 (3inch/80mm)
    const passPrntUrl = `starpassprnt://v1/print/nopreview?html=${encodeURIComponent(html)}&size=2&back=${encodeURIComponent(currentUrl)}`;
    window.location.href = passPrntUrl;
  }
}
