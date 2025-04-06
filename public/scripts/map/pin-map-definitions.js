import * as Common from '../common.js';
// URL系関数
export function getBlockFromUrlParam() {
  const params = new URL(document.location.href).searchParams;
  const block = params.get("block");
  console.log(block);
  return block;
}

export function getSmallBlockFromUrlParam() {
  const params = new URL(document.location.href).searchParams;
  const smallBlock = params.get("sb");
  console.log(smallBlock);
  return smallBlock;
}

export function getPrefectureIdFromUrlParam() {
  const params = new URL(document.location.href).searchParams;
  const prefectureId = params.get("prefecture");
  return prefectureId ? parseInt(prefectureId) : null;
}

// pin-map-definitions.js

export async function loadPrefectures() {
  const response = await fetch('/data/m_prefecture.json');
  const data = await response.json();
  return data;  // [{ m_prefecture_id, prefecture_name, ... }]
}

export async function loadAreas() {
  const response = await fetch('/data/m_area.json');
  const data = await response.json();
  return data;  // [{ m_area_id, area_name, ... }]
}


// ポスティングデータ読み込み
export async function loadPostingData() {
  const response = await fetch('/data/t_posting.json'); // ファイルパス適宜変更
  const data = await response.json();
  return data;
}

// ポスティング数の合計を算出	
export function calculateTotalPosting(postingData) {
  return postingData.reduce((sum, post) => sum + post.amount, 0);
}

// データ処理系
export function findKeyByAreaName(data, areaName) {
  for (const key in data) {
    if (data[key].area_name === areaName) {
      return key;
    }
  }
  return null;
}

export function filterDataByAreaIdAndSmallBlock(data, areaId, smallBlockId) {
  return data.filter(item => {
    return item.area_id === areaId && item.name.split('-')[0] === String(smallBlockId);
  });
}

// ステータス関連
export function getStatusText(status) {
  const statusDict = {
    0: "未",
    1: "完了",
    2: "異常",
    3: "予約",
    4: "要確認",
    5: "異常対応中",
    6: "削除"
  };
  return statusDict[status];
}
// ステータスIDから色を取得（任意で拡張）	
export function getPostingColor(status_id) {
  const statusColorMap = {
    0: '#0288D1', // 未
    1: '#FFD600', // 完了
    2: '#E65100', // 異常
    3: '#0F9D58', // 予約
    4: '#FF9706', // 要確認
    5: '#9106E9', // 異常対応中
    6: '#FFD600', // 削除
  };
  return statusColorMap[status_id] || '#0288D1'; // デフォルト青
}

export function getStatusColor(status) {
  switch (status) {
    case 0:
      return '#0288D1';
    case 1:
      return '#FFD600';
    case 2:
      return '#E65100';
    case 3:
      return '#0F9D58';
    case 4:
      return '#FF9706';
    case 5:
      return '#9106E9';
    case 6:
      return '#FFD600';
    default:
      return '#0288D1';
  }
}

export function getPinNote(note) {
  return note == null ? "なし" : note;
}

// ベースマップ定義
export const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
});

export const googleMap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: '&copy; Google'
});

export const japanBaseMap = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
});

export const baseLayers = {
  'OpenStreetMap': osm,
  'Google Map': googleMap,
  '国土地理院地図': japanBaseMap,
};

export const overlays = {
  '未': L.layerGroup(),
  '完了': L.layerGroup(),
  '異常': L.layerGroup(),
  '要確認': L.layerGroup(),
  '異常対応中': L.layerGroup(),
  '削除': L.layerGroup(),
  '期日前投票所': L.layerGroup(),
};

export const map = L.map('map', {
  layers: Object.values(overlays),
  preferCanvas: true,
});

export async function loadBoardPins(pins, layer, status = null) {
  const areaList = await Common.getAreaList();
  if (status != null) {
    pins = pins.filter(item => item.status == status);
  }

  pins.forEach(pin => {
    const marker = L.circleMarker([pin.lat, pin.long], {
      radius: 8,
      color: 'black',
      weight: 1,
      fillColor: getStatusColor(pin.status),
      fillOpacity: 0.9,
      border: 1,
    }).addTo(layer);

    marker.bindPopup(
      `<b>${areaList[pin.area_id]["area_name"]} ${pin.name}</b><br>ステータス: ${getStatusText(pin.status)}<br>備考: ${getPinNote(pin.note)}<br>座標: <a href="https://www.google.com/maps/search/${pin.lat},+${pin.long}" target="_blank" rel="noopener noreferrer">(${pin.lat}, ${pin.long})</a>`
    );
  });
}

export function onLocationFound(e) {
  const radius = e.accuracy / 2;
  L.marker(e.latlng).addTo(map).bindPopup("現在地").openPopup();
  L.circle(e.latlng, radius).addTo(map);
  map.setView(e.latlng, 14);
}

export function onLocationError(e) {
  const mapConfig = {
    '23-east': { lat: 35.7266074, long: 139.8292152, zoom: 14 },
    '23-west': { lat: 35.6861171, long: 139.6490942, zoom: 13 },
    '23-city': { lat: 35.6916896, long: 139.7254559, zoom: 14 },
    'tama-north': { lat: 35.731028, long: 139.481822, zoom: 13 },
    'tama-south': { lat: 35.6229399, long: 139.4584664, zoom: 13 },
    'tama-west': { lat: 35.7097579, long: 139.2904051, zoom: 12 },
    'island': { lat: 34.5291416, long: 139.2819004, zoom: 11 },
    'saitama': { lat: 35.858791, long: 139.648831, zoom: 14 },
  };

  const prefectureId = getPrefectureIdFromUrlParam();
  if (prefectureId !== null) {
    moveToPrefectureLocation(prefectureId);
  }

  const block = getBlockFromUrlParam();
  let latlong, zoom;

  if (block == null || !mapConfig[block]) {
    latlong = [35.6988862, 139.4649636];
    zoom = 11;
  } else {
    latlong = [mapConfig[block].lat, mapConfig[block].long];
    zoom = mapConfig[block].zoom;
  }

  map.setView(latlong, zoom);
}

export async function moveToPrefectureLocation(prefectureId) {
  try {
    const response = await fetch('/data/m_prefecture.json');
    const prefectures = await response.json();
    const prefecture = prefectures.find(p => p.m_prefecture_id === prefectureId);

    if (prefecture) {
      const lat = prefecture.prefecture_lat;
      const lng = prefecture.prefecture_long;
      map.setView([lat, lng], 10);
    } else {
      console.warn('都道府県IDが見つかりません:', prefectureId);
    }
  } catch (error) {
    console.error('都道府県の読み込みエラー:', error);
  }
}

export function openPostingForm() {
  const modal = new bootstrap.Modal(document.getElementById('postingModal'));
  modal.show();

  navigator.geolocation.getCurrentPosition(
    function (position) {
      document.getElementById('latInput').value = position.coords.latitude.toFixed(6);
      document.getElementById('lngInput').value = position.coords.longitude.toFixed(6);
    },
    function () {
      alert('現在地が取得できませんでした。緯度経度を手入力してください。');
    }
  );
}

export function addPostButton(map) {
  L.Control.PostButton = L.Control.extend({
    onAdd: function (map) {
      const btn = L.DomUtil.create('button', 'btn btn-primary');
      btn.innerText = '位置登録';
      btn.style.margin = '10px';
      L.DomEvent.on(btn, 'click', () => openPostingForm());
      return btn;
    },
    onRemove: function (map) { }
  });

  L.control.postButton = function (opts) {
    return new L.Control.PostButton(opts);
  };

  L.control.postButton({ position: 'topright' }).addTo(map);
}

// 地図にポスティングピンを表示	
// pin-map-definitions.js

export function createIndividualPinsLayer(pins, prefectureMap, areaMap) {
  const layerGroup = L.layerGroup();

  console.log('areaMap:',areaMap)
  console.log('230:',areaMap.get(230))

  pins.forEach(pin => {
    const createdAt = new Date(pin.created_at).toLocaleString();
    const prefectureName = prefectureMap.get(pin.prefecture_id) || '不明';
    const areaName = areaMap.get(pin.area_id) || '不明';
    const popupContent = `
      <b>日時:</b> ${createdAt}<br>
      <b>都道府県:</b> ${prefectureName}<br>
      <b>市区町村:</b> ${areaName}<br>
      <b>ポスティング数:</b> ${pin.amount}枚
    `;

    const marker = L.circleMarker([pin.lat, pin.long], {
      radius: 8,
      color: 'black',
      fillColor: getStatusColor(pin.status),
      fillOpacity: 0.9,
    });

    marker.bindPopup(popupContent);
    marker.addTo(layerGroup);
  });

  return layerGroup;
}

// pin-map-definitions.js

export function displayPostingPins(map, pins, prefectureMap, areaMap) {
  pins.forEach(pin => {
    const createdAt = new Date(pin.created_at).toLocaleString();
    const prefectureName = prefectureMap.get(pin.prefecture_id) || '不明';
    const areaName = areaMap.get(pin.m_area_id) || '不明';

    const popupContent = `
      <b>日時:</b> ${createdAt}<br>
      <b>都道府県:</b> ${prefectureName}<br>
      <b>市区町村:</b> ${areaName}<br>
      <b>ポスティング数:</b> ${pin.amount}枚
    `;

    const marker = L.circleMarker([pin.lat, pin.long], {
      radius: 8,
      color: 'black',
      fillColor: getStatusColor(pin.status),
      fillOpacity: 0.9,
    });

    marker.bindPopup(popupContent);
    marker.addTo(map);
  });
}

export function drawGroupedPins(postingData, map) {
  const groups = {};

  postingData.forEach(post => {
    const city = post.city_name || '未設定';  // city_name 前提（なければ別対応）
    if (!groups[city]) groups[city] = [];
    groups[city].push(post);
  });

  for (const city in groups) {
    const group = groups[city];
    const lat = average(group.map(p => p.lat));
    const lon = average(group.map(p => p.long));
    const total = group.reduce((sum, p) => sum + p.amount, 0);

    L.marker([lat, lon]).addTo(map)
      .bindPopup(`${city}<br>合計: ${total}枚`);
  }
}

export function drawIndividualPins(postingData, map) {
  postingData.forEach(post => {
    L.circleMarker([post.lat, post.long], {
      radius: 6,
      fillColor: getPostingColor(post.status_id),
      color: 'black',
      weight: 1,
      fillOpacity: 0.8
    }).addTo(map).bindPopup(
      `${post.city_name}<br>ポスティング数: ${post.amount}枚`
    );
  });
}

function clearAllPins() {
  map.eachLayer(layer => {
    if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}
export function createGroupedPinsLayer(postingData) {
  const cityGroups = new Map(); // cityName → 合計amount

  // 合計算出
  postingData.forEach(pin => {
    const city = pin.city_name || '不明';
    const key = city;
    if (!cityGroups.has(key)) {
      cityGroups.set(key, { lat: pin.lat, lon: pin.long, amount: 0 });
    }
    cityGroups.get(key).amount += pin.amount;
  });

  // マーカー描画
  const groupLayer = L.layerGroup();
  cityGroups.forEach((info, city) => {
    const marker = L.circleMarker([info.lat, info.lon], {
      radius: 10,
      color: 'blue',
      fillColor: '#00f',
      fillOpacity: 0.5
    }).bindPopup(`${city}: 合計${info.amount}枚`);
    marker.addTo(groupLayer);
  });

  return groupLayer;
}

export async function drawCityBoundaries(map) {
  try {

    const response = await fetch('/data/prefecture/iwate-municipal.geojson'); // ←ファイルパス注意
    const geojson = await response.json();

    const boundaryLayer = L.geoJSON(geojson, {
      style: {
        color: '#FF0000',
        weight: 1.5,
        opacity: 0.7,
        fill: false,
      }
    }).addTo(map);

    console.log('境界線レイヤー読み込み完了');
  } catch (err) {
    console.error('境界線GeoJSON読み込みエラー:', err);
  }
}

export async function drawPrefectureBoundaryById(prefecture_id, map) {
  const response = await fetch('/data/m_prefecture.json');
  const prefData = await response.json();

  const targetPref = prefData.find(p => Number(p.m_prefecture_id) === Number(prefecture_id));
  if (!targetPref) {
    console.error('prefecture_idが見つからない:', prefecture_id);
    return;
  }

  const alphabet = targetPref.prefecture_name_alphabet;
  const geoJsonUrl = `/data/prefecture/${alphabet}-municipal.geojson`;

  try {
    const geoResp = await fetch(geoJsonUrl);
    const geojson = await geoResp.json();

    L.geoJSON(geojson, {
      style: {
        color: '#007bff',
        weight: 1,
        fillOpacity: 0.05,
      }
    }).addTo(map);

  } catch (e) {
    console.error(`GeoJSON読み込みエラー (${geoJsonUrl}):`, e.message);
  }
}
