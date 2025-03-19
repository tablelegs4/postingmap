// Leaflet.jsで地図オブジェクトを作成し、初期表示位置とズームレベルを設定
const map = L.map("map").setView([35.669400214188606, 139.48343915372877], 11);

// OpenStreetMapのタイルを地図に追加（背景地図）
const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Linked Open Addresses Japan',
}).addTo(map);

// 凡例（グラデーションと数値ラベル）を作成する関数
function legend() {
  var control = L.control({position: 'topright'});  // 地図の右上に表示

  control.onAdd = function () {
      var div = L.DomUtil.create('div', 'info legend');  // 外枠div作成
      grades = [1, 0.75, 0.5, 0.25, 0];  // 凡例の割合（100%〜0%）

      div.innerHTML += '<p>凡例</p>';  // タイトル追加

      var legendInnerContainerDiv = L.DomUtil.create('div', 'legend-inner-container', div);
      legendInnerContainerDiv.innerHTML += '<div class="legend-gradient"></div>';  // グラデーションバー

      var labelsDiv = L.DomUtil.create('div', 'legend-labels', legendInnerContainerDiv);
      for (var i = 0; i < grades.length; i++) {
        labelsDiv.innerHTML += '<span>' + grades[i] * 100 + '%</span>';  // ラベル表示
      }
      return div;
  };

  return control;  // Leafletコントロールとして返却
}

// 進捗率（0.0〜1.0）に応じた色を算出（グラデーション計算）
function getProgressColor(percentage) {
    // 色の段階（グラデーション定義）
    const colorStops = [
        { pct: 0.0, color: { r: 254, g: 237, b: 222 } }, // 薄い色
        { pct: 0.25, color: { r: 253, g: 190, b: 133 } },
        { pct: 0.5, color: { r: 253, g: 141, b: 60 } },
        { pct: 0.75, color: { r: 230, g: 85, b: 13 } },
        { pct: 0.999, color: { r: 166, g: 54, b: 3 } },  // 濃い色
        { pct: 1.0, color: { r: 150, g: 0, b: 73 } }     // 進捗100%以上時（例外対策）
    ];

    // 進捗率が0〜1の範囲を超えないように制限
    percentage = Math.max(0, Math.min(1, percentage));

    // 進捗率に最も近い2色を探す
    let lower = colorStops[0];
    let upper = colorStops[colorStops.length - 1];

    for (let i = 1; i < colorStops.length; i++) {
        if (percentage <= colorStops[i].pct) {
            upper = colorStops[i];
            lower = colorStops[i - 1];
            break;
        }
    }

    // 進捗率に基づいて色を補間計算
    const rangePct = (percentage - lower.pct) / (upper.pct - lower.pct);
    const r = Math.round(lower.color.r + rangePct * (upper.color.r - lower.color.r));
    const g = Math.round(lower.color.g + rangePct * (upper.color.g - lower.color.g));
    const b = Math.round(lower.color.b + rangePct * (upper.color.b - lower.color.b));

    // rgb形式で返却
    return `rgb(${r}, ${g}, ${b})`;
}

// 各エリア（市区町村）の地図表示スタイルを指定
function getGeoJsonStyle(progress) {
  return {
    color: 'black',                         // 外枠線の色
    fillColor: getProgressColor(progress),  // 進捗率に応じた塗り色
    fillOpacity: 0.7,                       // 塗りの透明度
    weight: 2                               // 外枠線の太さ
  }
}

// 各種データ取得用変数
let areaList;
let progress;

// 非同期でエリア情報・進捗率・残り件数を取得（全部取得してから地図に反映）
Promise.all([getAreaList(), getProgress(), getProgressCountdown()]).then(function(res) {
  areaList = res[0];           // 市区町村リスト
  progress = res[1];           // 各エリアの進捗率（0〜1）
  progressCountdown = res[2];  // 残り件数

  // 各エリアごとにGeoJSONを取得＆地図に追加
  for (let [key, areaInfo] of Object.entries(areaList)) {
    console.log(areaInfo['area_name']);
    fetch(`https://uedayou.net/loa/東京都${areaInfo['area_name']}.geojson`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch geojson for ${areaInfo['area_name']}`);
        }
        return response.json();
      })
      .then((data) => {
        // GeoJSONデータを地図にポリゴンとして表示
        const polygon = L.geoJSON(data, {
          style: getGeoJsonStyle(progress[key]),  // スタイル適用
        });

        // ポップアップ（市区町村名・進捗率・残件数）
        polygon.bindPopup(
          `<b>${areaInfo['area_name']}</b><br>
          ポスター貼り進捗: ${(progress[key]*100).toFixed(1)}%<br>
          残り: ${progressCountdown[key]}ヶ所`
        );

        polygon.addTo(map);  // 地図に追加
      })
      .catch((error) => {
        console.error('Error fetching geojson:', error);
      });
  }

  // 地図に進捗率表示ボックス・残件数表示・凡例を追加
  progressBox((progress['total']*100).toFixed(2), 'topright').addTo(map);
  progressBoxCountdown((parseInt(progressCountdown['total'])), 'topright').addTo(map);
  legend().addTo(map);

}).catch((error) => {
  console.error('Error in fetching data:', error);
});
