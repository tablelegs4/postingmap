function geocodeAddresses() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 住所が記載されている列番号（例えば、A列の場合は1）
  const addressColumn = 2;  // 住所が記入されている列（A列）
  
  // 緯度と経度を記入する列番号（緯度をB列、経度をC列に記入する場合）
  const latitudeColumn = 3;  // 緯度を記入する列（B列）
  const longitudeColumn = 4;  // 経度を記入する列（C列）
  
  // 住所が記入されている最終行を取得
  const lastRow = sheet.getLastRow();
  
  // Google Maps APIキーを環境変数から取得
  const apiKey = PropertiesService.getScriptProperties().getProperty('MAPS_API_KEY');
  
  if (!apiKey) {
    Logger.log('APIキーが設定されていません。');
    return;
  }
  
  // 住所を基に緯度と経度を取得する関数
  for (let i = 2; i <= lastRow; i++) {  // 1行目がヘッダーの場合、2行目から開始
    const address = sheet.getRange(i, addressColumn).getValue();
    
    if (address) {
      const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address) + '&key=' + apiKey;
      
      // APIを呼び出して結果を取得
      const response = UrlFetchApp.fetch(geocodeUrl);
      const json = JSON.parse(response.getContentText());
      
      if (json.status === 'OK') {
        const lat = json.results[0].geometry.location.lat;
        const lng = json.results[0].geometry.location.lng;
        
        // 緯度と経度を指定した列に書き込む
        sheet.getRange(i, latitudeColumn).setValue(lat);
        sheet.getRange(i, longitudeColumn).setValue(lng);
      } else {
        sheet.getRange(i, latitudeColumn).setValue('Geocoding failed');
        sheet.getRange(i, longitudeColumn).setValue('Geocoding failed');
      }
    }
  }
}
