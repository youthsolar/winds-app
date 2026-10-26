// GEO：品牌實體（Organization），首頁與品牌故事頁共用，AI 引擎靠這個認識「找風問幸福是誰」
export const ORG_JSONLD = {
  '@type': 'Organization',
  '@id': 'https://winds.tw/#org',
  name: '找風問幸福',
  alternateName: 'Uneedwind',
  url: 'https://winds.tw',
  logo: 'https://winds.tw/assets/logo.png',
  description: '找風問幸福提供老師的解卦、通靈問事、元辰宮與風水，也有風易揚老師親手畫的符令。',
  founder: { '@type': 'Person', name: '風易揚老師', url: 'https://winds.tw/lp/fengyiyang' },
  address: [
    { '@type': 'PostalAddress', streetAddress: '大安路一段75巷7號10樓之4', addressLocality: '大安區', addressRegion: '台北市', postalCode: '106', addressCountry: 'TW' },
    { '@type': 'PostalAddress', streetAddress: '松德路46號4樓之1', addressLocality: '信義區', addressRegion: '台北市', postalCode: '110', addressCountry: 'TW' },   /* 2026-10-27 新增信義地點 */
  ],
  areaServed: 'TW',
  sameAs: [
    'https://www.facebook.com/1056598467870017',
    'https://www.instagram.com/uneedwind',
    'https://www.threads.net/@uneedwind',
  ],
};
