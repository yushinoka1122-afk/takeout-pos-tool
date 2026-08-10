// This is a utility to send data to Google Apps Script (GAS) Web App.
// スプレッドシートへデータを送るためのダミー/実際の通信関数です。
import * as XLSX from 'xlsx';

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


export async function fetchProductsFromCSV() {
  const CSV_URL = localStorage.getItem('pos_csv_url') || '';

  if (!CSV_URL || !CSV_URL.startsWith('http')) {
    return null;
  }

  try {
    // 共有リンクをCSVエクスポート用リンクに変換
    let fetchUrl = CSV_URL;
    if (CSV_URL.includes('/edit')) {
      fetchUrl = CSV_URL.split('/edit')[0] + '/export?format=csv';
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    // ArrayBufferとして取得してXLSXライブラリでパース（カンマ等のエッジケース対応）
    const arrayBuffer = await response.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    const items = [];
    let currentCategory = 'その他';
    
    // 1行目はヘッダーなのでスキップ
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;
      
      const rawCategory = row[0]; // A列：ジャンル
      const name = row[1];        // B列：商品名
      const rawPrice = row[2];    // C列：価格
      
      if (rawCategory !== undefined && rawCategory !== null && String(rawCategory).trim() !== "") {
        currentCategory = String(rawCategory).trim();
      }
      
      if (!name) continue;
      
      const priceStr = String(rawPrice || 0).replace(/[^0-9]/g, '');
      const price = parseInt(priceStr, 10);
      
      if (!isNaN(price)) {
        items.push({
          id: 'csv_' + i,
          name: String(name),
          price: price,
          category: currentCategory
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error('CSVからのメニュー取得エラー:', error);
    return null;
  }
}
