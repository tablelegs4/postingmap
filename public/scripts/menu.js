async function getRegionAndPrefecture() {
    const regionResponse = await fetch('/data/m_region.json');
    const prefectureResponse = await fetch('/data/m_prefecture.json');
  
    const regions = await regionResponse.json();
    const prefectures = await prefectureResponse.json();
  
    return { regions, prefectures };
  }
  
  function generateAccordion(regions, prefectures) {
    const container = document.getElementById('container');
  
    const accordion = document.createElement('div');
    accordion.id = 'accordionRegions';
    accordion.classList.add('accordion');
    container.appendChild(accordion);
  
    regions.forEach((region, index) => {
      const regionId = `region-${index}`;
  
      // アコーディオンアイテム
      const accordionItem = document.createElement('div');
      accordionItem.classList.add('accordion-item');
  
      // ヘッダー
      const header = document.createElement('h2');
      header.classList.add('accordion-header');
      header.id = `heading-${regionId}`;
  
      const button = document.createElement('button');
      button.classList.add('accordion-button', 'collapsed');
      button.setAttribute('type', 'button');
      button.setAttribute('data-bs-toggle', 'collapse');
      button.setAttribute('data-bs-target', `#collapse-${regionId}`);
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `collapse-${regionId}`);
      button.textContent = region.region_name;
  
      header.appendChild(button);
  
      // 折りたたみ部分
      const collapseDiv = document.createElement('div');
      collapseDiv.id = `collapse-${regionId}`;
      collapseDiv.classList.add('accordion-collapse', 'collapse');
      collapseDiv.setAttribute('aria-labelledby', `heading-${regionId}`);
      collapseDiv.setAttribute('data-bs-parent', '#accordionRegions');
  
      const body = document.createElement('div');
      body.classList.add('accordion-body', 'list-group');
  
      // 地方に属する都道府県をリスト化
      const regionPrefectures = prefectures.filter(p => p.region_id === region.m_region_id);
      regionPrefectures.forEach(pref => {
        const link = document.createElement('a');
        link.href = `./map?prefecture=${pref.m_prefecture_id}`;
        link.classList.add('list-group-item', 'list-group-item-action');
        link.textContent = pref.prefecture_name;
        body.appendChild(link);
      });
  
      collapseDiv.appendChild(body);
      accordionItem.appendChild(header);
      accordionItem.appendChild(collapseDiv);
      accordion.appendChild(accordionItem);
    });
  }
  
  // 初期化
  async function init() {
    try {
      const { regions, prefectures } = await getRegionAndPrefecture();
      generateAccordion(regions, prefectures);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  
  init();
  