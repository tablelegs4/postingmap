// 地域リストJSONを非同期で取得
export async function getAreaList() {
  const arealistResponse = await fetch('/data/arealist.json');
  const arealist = await arealistResponse.json();
  return arealist;
}

// 進捗状況データ（完了率）を非同期で取得
export async function getProgress() {
  const progressResponse = await fetch('/data/summary.json');
  const progress = await progressResponse.json();
  return progress;
}

// 進捗状況データ（残り枚数）を非同期で取得
export async function getProgressCountdown() {
  const progressResponse = await fetch('/data/summary_absolute.json');
  const progress = await progressResponse.json();
  return progress;
}

// 期日前投票所のピンデータを非同期で取得
async function getVoteVenuePins() {
  const response = await fetch('/data/vote_venue.json')
  return response.json();
}

// 掲示板のピンデータをブロックや小ブロックに応じて取得・フィルター
export async function getBoardPins(block = null, smallBlock = null) {
  let response;

  // GETリクエストでブロックの指定があるとき
  if (block == null) {
    // 全データ取得
    response = await fetch('/data/all.json');
  }
  // GETリクエストでブロックの指定がないとき
  else {
    // ブロック単位で取得
    response = await fetch(`/data/block/${block}.json`);
  }

  const data = await response.json();

  // 小ブロック指定なし → 全データ返却
  if (smallBlock == null) {
    return data;
  } else {
    // 小ブロック指定あり → エリア名とIDを抽出し、対象データをフィルター
    const smallBlockSplit = smallBlock.split('-');
    const areaName = smallBlockSplit[0];
    const smallBlockId = Number(smallBlockSplit[1]);
    const areaList = await getAreaList();
    const areaId = Number(findKeyByAreaName(areaList, areaName));

    const filteredData = filterDataByAreaIdAndSmallBlock(data, areaId, smallBlockId);
    return filteredData;
  }
}

// 投票所のピンをマップレイヤーに追加・ポップアップを設定
export async function loadVoteVenuePins(layer) {
  const pins = await getVoteVenuePins();
  pins.forEach(pin => {
    var marker = L.marker([pin.lat, pin.long], {
      icon: grayIcon
    }).addTo(layer);

    marker.bindPopup(
      `<b>期日前投票所: ${pin.name}</b><br>${pin.address}<br>期間: ${pin.period}<br>座標: <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a>`
    );
  });
}

// マップに「完了率」を表示するカスタムコントロールを作成
export function progressBox(progressValue, position) {
  var control = L.control({ position: position });
  control.onAdd = function () {
    var div = L.DomUtil.create('div', 'info progress');
    div.innerHTML += '<p>完了率 (全域)</p>';
    div.innerHTML += `<p><span class="progressValue">${progressValue}</span>%</p>`;
    return div;
  };
  return control;
}

// マップに「残り枚数」を表示するカスタムコントロールを作成
export function progressBoxCountdown(progressValue, position) {
  var control = L.control({ position: position });
  control.onAdd = function () {
    var div = L.DomUtil.create('div', 'info progress');
    div.innerHTML += '<p>残り</p>';
    div.innerHTML += `<p><span class="progressValue">${progressValue}</span>ヶ所</p>`;
    return div;
  };
  return control;
}

// ベースマップ：OpenStreetMap
export const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// ベースマップ：Google Maps
export const googleMap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  maxZoom: 18,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  attribution: '&copy; Google'
});

// ベースマップ：国土地理院の淡色地図
export const japanBaseMap = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
});

// ピンアイコン（灰色マーカー）
const grayIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
  iconSize: [20, 32.8],
  popupAnchor: [1, -10],
  shadowSize: [32.8, 32.8],
  className: "icon-gray",
});

// URLから指定パラメータの値を取得
function getParamFromUrl(paramName) {
  const params = new URL(document.location.href).searchParams;
  return params.get(paramName);
}

// 制覇ブロックデータを取得
async function getConquerblock() {
  const conquerblockResponse = await fetch('/data/conquerblock.json');
  const conquerblock = await conquerblockResponse.json();
  return conquerblock;
}

// 制覇データをブロック単位で取得（全体 or 特定ブロック）
async function getConquerdata(block = null) {
  let response;
  if (block == null) {
    response = await fetch('/data/conquerlist.json');
  } else {
    response = await fetch(`/data/conquer/${block}.json`);
  }
  return response.json();
}

// 全域の制覇枚数を取得
async function getConquerareatotal() {
  const conqueareatotalResponse = await fetch('/data/conquerareatotal.json');
  const conqueareatotal = await conqueareatotalResponse.json();
  return conqueareatotal;
}

// マップに「枚数（全域）」を表示するカスタムコントロールを作成
function areatotalBox(totalValue, position) {
  var control = L.control({ position: position });
  control.onAdd = function () {
    var div = L.DomUtil.create('div', 'info progress');
    div.innerHTML += '<p>枚数 (全域)</p>';
    div.innerHTML += `<p><span class="progressValue">${totalValue}</span>枚</p>`;
    return div;
  };
  return control;
}

// 進捗達成の節目（例：0枚、100枚、500枚…）
const milestones = [0, 100, 500, 1000, 5000];
