// 2026-11-22 部落格體檢：薄的項目介紹文（EasyStore 搬來、拿掉價格後只剩一兩句）下架並轉到對應預約項目頁。
// Jeffery 拍板「照原決定全部轉項目頁」。WP 那邊這些文章改成草稿；wp-blog-loader 也會把對照表上的文章一律當草稿（WP 被誤改回發佈也不會上站）。public/_redirects 有同一份對照（兩邊要一起改）。
// 這份也給 wp-blog-loader 用：其他文章內文連到這些文章的連結，建站時直接改連目的地，不多繞一次轉址。
export const BLOG_REDIRECTS: Record<string, string> = {
  'hello-world': '/blog/',
  // 更早就有的兩條（public/_redirects 第 3–6 行），補進來讓內文連結也直接改連目的地
  lifebook: '/lp/yiziliang/',
  'reconciliation-ritual-spiritual-case': '/blog/blog-344/',
  heavengivesmoney: '/services/sb-31/',
  palacedefense: '/services/sb-39/',
  rainbowbridge: '/services/sb-34/',
  renamepalace: '/services/sb-43/',
  destinybook: '/services/sb-19/',
  increasewealth: '/services/sb-30/',
  psychic: '/services/sb-18/',
  ancestor: '/services/sb-37/',
  palacefight: '/services/sb-45/',
  bewareofvillains: '/services/sb-40/',
  reincarnation: '/services/sb-36/',
  fengshui: '/services/sb-42/',
  palace: '/services/sb-17/',
  soulpalace: '/services/sb-17/',
  spiritdoctor: '/services/sb-46/',
  mirrormethod: '/services/sb-79/',
  heartroom: '/services/sb-22/',
  babysaving: '/services/sb-35/',
  gunereyes: '/services/sb-41/',
  popularity: '/services/sb-24/',
  causepalace: '/services/sb-32/',
  heartpalace: '/services/sb-44/',
  palacerestore: '/services/sb-38/',
  childsick: '/services/sb-47/',
  foxfairyspell: '/services/sb-23/',
  marrypalace: '/services/sb-25/',
  psychictarot: '/services/sb-52/',
};

// 六位老師的預約頁（/lp/<代稱>/）。文末預約區、內文「預約／找○○老師」的連結都照這張表。
export const TEACHER_LP: Record<string, string> = {
  風易揚: 'fengyiyang',
  芊蘭: 'qianlan',
  風賜靈: 'fengciling',
  伊紫蓮: 'yiziliang',
  玄奇: 'xuanqi',
  竹韻: 'zhuyun',
};
