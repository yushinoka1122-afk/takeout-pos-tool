import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle } from 'lucide-react';
import { fetchProductsFromCSV } from '../utils/gas';

export default function Settings({ onSave, onBack }) {
  const [dataPreview, setDataPreview] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('pos_gas_url') || '');
  const [csvUrl, setCsvUrl] = useState(localStorage.getItem('pos_csv_url') || '');
  const [localProducts, setLocalProducts] = useState([]);
  const [imageUpdates, setImageUpdates] = useState(0); // Trigger re-renders for images

  useEffect(() => {
    const saved = localStorage.getItem('pos_products');
    if (saved) {
      try {
        setLocalProducts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleGasUrlChange = (e) => {
    const val = e.target.value;
    setGasUrl(val);
    localStorage.setItem('pos_gas_url', val);
  };
  
  const handleCsvUrlChange = (e) => {
    const val = e.target.value;
    setCsvUrl(val);
    localStorage.setItem('pos_csv_url', val);
  };

  const saveAndProceed = (formatted) => {
    setDataPreview(formatted);
    setIsSuccess(true);
    localStorage.setItem('pos_products', JSON.stringify(formatted));
    setLocalProducts(formatted);
    setTimeout(() => {
      onSave(formatted);
    }, 1500);
  };

  const handleImageUpload = (productName, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 300;
        
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        try {
          localStorage.setItem('pos_img_' + productName, dataUrl);
          setImageUpdates(prev => prev + 1);
        } catch (err) {
          alert('保存容量がいっぱいです。iPadの空き容量を確認してください。');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (productName) => {
    localStorage.removeItem('pos_img_' + productName);
    setImageUpdates(prev => prev + 1);
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
          <h3 style={{marginBottom: '8px', fontSize: '1.1rem'}}>クラウド連携（スプレッドシート）</h3>
          
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px'}}>① 商品リストのURL（ウェブ公開CSV）</label>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px'}}>
              商品の読み込みに使います。スプレッドシートの共有リンクをそのまま貼り付けてください。
            </p>
            <div style={{display: 'flex', gap: '8px'}}>
              <input 
                type="text" 
                placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                value={csvUrl}
                onChange={handleCsvUrlChange}
                style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem'}}
              />
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  if (!csvUrl) return alert('商品リストのURLを入力してください');
                  const data = await fetchProductsFromCSV();
                  if (data && data.length > 0) {
                    saveAndProceed(data);
                  } else {
                    alert('データの取得に失敗しました。URLやシートの内容を確認してください。');
                  }
                }}
              >
                手動同期
              </button>
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px'}}>② 売上データの送信先URL（GAS）</label>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px'}}>
              売上の記録に使います。GAS（Google Apps Script）の「ウェブアプリのURL」を貼り付けてください。
            </p>
            <input 
              type="text" 
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrl}
              onChange={handleGasUrlChange}
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem'}}
            />
          </div>
        </div>

        {localProducts.length > 0 && (
          <div style={{marginBottom: '30px', textAlign: 'left', background: 'var(--bg)', padding: '16px', borderRadius: '8px'}}>
            <h3 style={{marginBottom: '16px', fontSize: '1.1rem'}}>商品画像の設定（iPad内に保存）</h3>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px'}}>
              ※設定した画像はiPadの中に保存されます。重くならないよう自動で圧縮されます。
            </p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px'}}>
              {localProducts.map(product => {
                const imgData = localStorage.getItem('pos_img_' + product.name);
                return (
                  <div key={product.id} style={{border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{width: '60px', height: '60px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', flexShrink: 0}}>
                      {imgData ? (
                        <img src={imgData} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : product.image ? (
                        <img src={product.image} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b'}}>No Img</div>
                      )}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px'}}>
                        {product.name}
                      </div>
                      <div style={{display: 'flex', gap: '4px'}}>
                        <label style={{fontSize: '0.8rem', padding: '4px 8px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'inline-block'}}>
                          選択
                          <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleImageUpload(product.name, e.target.files[0])} />
                        </label>
                        {imgData && (
                          <button onClick={() => clearImage(product.name)} style={{fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
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
                      <td>¥{(item.price || 0).toLocaleString()}</td>
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
