import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle } from 'lucide-react';

export default function Settings({ onSave, onBack }) {
  const [dataPreview, setDataPreview] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('pos_gas_url') || '');

  const handleGasUrlChange = (e) => {
    const val = e.target.value;
    setGasUrl(val);
    localStorage.setItem('pos_gas_url', val);
  };

  const saveAndProceed = (formatted) => {
    setDataPreview(formatted);
    setIsSuccess(true);
    localStorage.setItem('pos_products', JSON.stringify(formatted));
    setTimeout(() => {
      onSave(formatted);
    }, 1500);
  };

  // CSV等のJSON形式用のパース関数
  const processData = (rawData) => {
    const formatted = rawData.map((row, index) => {
      const getVal = (possibleKeys) => {
        const keys = Object.keys(row);
        for (const k of keys) {
          if (possibleKeys.includes(k.trim().toLowerCase())) return row[k];
        }
        return null;
      };

      return {
        id: getVal(['id', 'id番号']) || `item_${index}`,
        category: getVal(['category', 'ジャンル', 'カテゴリ', 'カテゴリー']) || 'その他',
        name: getVal(['name', '商品名', '名前']) || '不明な商品',
        price: parseInt(getVal(['price', '税込表記', '価格', '金額', '値段', '単価']) || 0, 10),
      };
    }).filter(item => item.name !== '不明な商品' && !isNaN(item.price));
    
    saveAndProceed(formatted);
  };

  // Excel用のスマートパース関数（結合セルやヘッダー位置の自動検知）
  const process2DArray = (rows) => {
    let headerRowIndex = -1;
    let colMap = { name: -1, price: -1, category: -1 };

    // 1. ヘッダー行を探す（最初の15行から「商品名」が含まれる行を探す）
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i] || [];
      const nameIndex = row.findIndex(cell => cell && typeof cell === 'string' && (cell.includes('商品名') || cell.includes('名前')));
      if (nameIndex !== -1) {
        headerRowIndex = i;
        colMap.name = nameIndex;
        // 他の列も特定する
        colMap.price = row.findIndex(cell => cell && typeof cell === 'string' && (cell.includes('税込') || cell.includes('価格') || cell.includes('金額') || cell.includes('単価')));
        colMap.category = row.findIndex(cell => cell && typeof cell === 'string' && (cell.includes('ジャンル') || cell.includes('カテゴリ')));
        
        // カテゴリ名が明記されていないが、名前の左側にある場合（例：結合セル）
        if (colMap.category === -1 && nameIndex > 0) {
          colMap.category = nameIndex - 1;
        }
        break;
      }
    }

    if (headerRowIndex === -1 || colMap.name === -1) {
      alert('表の中に「商品名」と書かれた見出し行が見つかりませんでした。データを確認してください。');
      return;
    }

    const formatted = [];
    let currentCategory = 'その他';

    // 2. データを抽出する
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // エクセルの結合セル対応：カテゴリ列に値があれば更新、なければ前回のものを引き継ぐ
      if (colMap.category !== -1 && row[colMap.category] !== undefined && row[colMap.category] !== null && row[colMap.category] !== "") {
        currentCategory = String(row[colMap.category]).trim();
      }

      const name = row[colMap.name];
      const priceRaw = colMap.price !== -1 ? row[colMap.price] : 0;
      
      // 商品名が空の行はスキップ
      if (!name) continue; 
      
      const cleanName = String(name).trim();
      
      // サブヘッダー（2つ目以降の表の見出し行）をスキップ
      if (cleanName.includes('商品名') || cleanName.includes('名前')) {
        continue;
      }

      // 数字以外の文字（¥やカンマなど）を除去してパース
      const price = parseInt(String(priceRaw).replace(/[^0-9]/g, ''), 10);

      // 長すぎるカテゴリ名（タイトル行など）の場合は、後ろの文字（〜リストなど）を抽出するかそのままにする
      let cleanCategory = currentCategory;
      if (cleanCategory.includes('ベーカリーカフェC')) {
         cleanCategory = cleanCategory.replace(/ベーカリーカフェC\s*神戸さんちか店/g, '').replace('リスト', '').trim();
      }

      formatted.push({
        id: `item_${i}`,
        category: cleanCategory || 'その他',
        name: cleanName,
        price: isNaN(price) ? 0 : price
      });
    }

    return formatted;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        let allItems = [];
        for (let i = 0; i < wb.SheetNames.length; i++) {
          const wsname = wb.SheetNames[i];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          const sheetItems = process2DArray(data);
          if (sheetItems && sheetItems.length > 0) {
            allItems = allItems.concat(sheetItems);
          }
        }
        
        if (allItems.length === 0) {
          alert('商品を読み取れませんでした。データを確認してください。');
          return;
        }

        const finalItems = allItems.map((item, index) => ({ ...item, id: `item_${index}` }));
        saveAndProceed(finalItems);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('CSVまたはExcelファイル(.xlsx)をアップロードしてください。');
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2 className="settings-title">商品データの登録 (CSV / Excel)</h2>
        <p style={{marginBottom: '20px', color: 'var(--text-muted)'}}>
          商品情報が含まれるCSV、またはExcelファイル(.xlsx)をアップロードしてください。<br/>
          ※表の中に <code>「商品名」</code> および <code>「税込表記（または価格）」</code> という見出しが含まれている必要があります。
        </p>

        <div style={{marginBottom: '30px', textAlign: 'left', background: 'var(--bg)', padding: '16px', borderRadius: '8px'}}>
          <h3 style={{marginBottom: '8px', fontSize: '1.1rem'}}>連携スプレッドシートの設定</h3>
          <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px'}}>
            Google Apps Scriptで発行した「ウェブアプリのURL」を貼り付けてください。
          </p>
          <input 
            type="text" 
            placeholder="https://script.google.com/macros/s/.../exec"
            value={gasUrl}
            onChange={handleGasUrlChange}
            style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem'}}
          />
        </div>
        
        <label className="file-drop-area">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            onChange={handleFileUpload} 
            style={{display: 'none'}} 
          />
          {isSuccess ? (
            <div style={{color: 'var(--success)'}}>
              <CheckCircle size={48} className="upload-icon" style={{color: 'var(--success)'}} />
              <h3>読み込み成功！</h3>
              <p>レジ画面へ移動します...</p>
            </div>
          ) : (
            <div>
              <Upload size={48} className="upload-icon" />
              <h3>クリックしてファイルを選択 (CSV/Excel)</h3>
            </div>
          )}
        </label>
        
        {dataPreview.length > 0 && (
          <div>
            <h3>プレビュー ({dataPreview.length}件)</h3>
            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>カテゴリ</th>
                    <th>商品名</th>
                    <th>価格</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.slice(0, 10).map((item, i) => (
                    <tr key={i}>
                      <td>{item.id}</td>
                      <td>{item.category}</td>
                      <td>{item.name}</td>
                      <td>¥{item.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{marginTop: '30px', textAlign: 'right'}}>
          <button className="btn btn-outline" onClick={onBack}>
            レジ画面に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
