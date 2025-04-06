import * as MapDefs from './pin-map-definitions.js';
import * as Common from '../common.js';

// ベースマップ・UI・位置取得
MapDefs.japanBaseMap.addTo(MapDefs.map);
L.control.layers(MapDefs.baseLayers, MapDefs.overlays).addTo(MapDefs.map);
MapDefs.map.on('locationfound', MapDefs.onLocationFound);
MapDefs.map.on('locationerror', MapDefs.onLocationError);
MapDefs.map.locate({ setView: false, maxZoom: 11 });
MapDefs.addPostButton(MapDefs.map);

const prefectures = await MapDefs.loadPrefectures();
const areas = await MapDefs.loadAreas();


const prefectureMap = new Map();
prefectures.forEach(p => {
  prefectureMap.set(p.m_prefecture_id, p.prefecture_name);
});

const areaMap = new Map();
areas.forEach(a => {
  areaMap.set(a.m_area_id, a.area_name);
});

// ポスティングデータ読み込み
const postingData = await MapDefs.loadPostingData();
MapDefs.displayPostingPins(MapDefs.map, postingData, prefectureMap, areaMap);

console.log(`合計ポスティング: ${MapDefs.calculateTotalPosting(postingData)}枚`);

await MapDefs.drawPrefectureBoundaryById(3, MapDefs.map);  // 3 = 岩手県

// グループ/個別レイヤー作成
const cityGroupedLayer = MapDefs.createGroupedPinsLayer(postingData);
const individualLayer = MapDefs.createIndividualPinsLayer(postingData, prefectureMap, areaMap);
// 初期表示はまとめピン
cityGroupedLayer.addTo(MapDefs.map);

// ズームで切り替え
MapDefs.map.on('zoomend', () => {
  const zoom = MapDefs.map.getZoom();
  if (zoom >= 12) {
    MapDefs.map.removeLayer(cityGroupedLayer);
    MapDefs.map.addLayer(individualLayer);
  } else {
    MapDefs.map.removeLayer(individualLayer);
    MapDefs.map.addLayer(cityGroupedLayer);
  }
});

await MapDefs.drawCityBoundaries(MapDefs.map);

