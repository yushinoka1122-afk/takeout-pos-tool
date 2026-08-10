// This is a utility to send data to Google Apps Script (GAS) Web App.
// スプレッドシートへデータを送るためのダミー/実際の通信関数です。

export async function sendSalesDataToGAS(orderData) {
  const GAS_WEBAPP_URL = localStorage.getItem('pos_gas_url') || '';

  if (!GAS_WEBAPP_URL || !GAS_WEBAPP_URL.startsWith('http')) {
    alert('スプレッドシート連携用のURLが設定されていません。右上の「設定」から設定してください。');
    return false;
  }

  try {
    const response = await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', // ブラウザからGASへ送る際のCORS回避
      headers: {
        'Content-Type': 'text/plain', // application/json だとCORSエラーになることがあるため
      },
      body: JSON.stringify(orderData)
    });
    return true;
  } catch (error) {
    console.error('GASへの送信エラー:', error);
    return false;
  }
}

export async function fetchMenuDataFromGAS() {
  const GAS_WEBAPP_URL = localStorage.getItem('pos_gas_url') || '';

  if (!GAS_WEBAPP_URL || !GAS_WEBAPP_URL.startsWith('http')) {
    return null;
  }

  try {
    // GETリクエストでメニューデータを取得 (GASはリダイレクトでCORSヘッダを付与する)
    const response = await fetch(GAS_WEBAPP_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GASからのメニュー取得エラー:', error);
    return null;
  }
}
