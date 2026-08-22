const CATEGORIES = [
  "打招呼问候",
  "查快递",
  "费用价格咨询",
  "发货寄件",
  "快递时效",
  "丢件理赔",
  "访问频道",
  "未知问题",
];

const FALLBACK_KEYWORD = "学习中";

const LOOKUP_KEYS = {
  打招呼问候: ["打招呼问候", "你好", "您好"],
  查快递: ["查快递", "查物流", "查件"],
  费用价格咨询: ["费用价格咨询", "怎么收费", "怎么算钱", "怎么计费"],
  发货寄件: ["发货寄件", "怎么寄", "怎么发", "发货"],
  快递时效: ["快递时效", "时效", "多久到", "什么时候到"],
  丢件理赔: ["丢件理赔", "理赔", "丢件", "赔偿"],
  访问频道: ["访问频道", "进频道", "频道"],
  未知问题: ["未知问题"],
  学习中: ["学习中"],
};

const CUES = {
  打招呼问候: [
    "你好",
    "您好",
    "早上好",
    "中午好",
    "下午好",
    "晚上好",
    "在吗",
    "在嘛",
    "在不在",
    "有人吗",
    "有空吗",
    "哈喽",
    "哈罗",
    "嗨",
    "喂",
    "请问一下",
    "打扰一下",
    "麻烦问下",
    "hi",
    "hello",
    "hey",
    "good morning",
    "good evening",
  ],
  查快递: [
    "查快递",
    "查物流",
    "查单号",
    "查询包裹",
    "查件",
    "物流查询",
    "快递查询",
    "看物流",
    "物流状态",
    "快递状态",
    "包裹进度",
    "帮我查",
    "查一下这个件",
    "帮我跟进",
    "货到哪",
    "到哪了",
    "走到哪",
    "现在在哪",
    "物流走到",
    "目前到哪",
    "到什么位置",
    "包裹现在",
    "这个单号",
    "跟进这个包裹",
    "唛头的物流",
  ],
  费用价格咨询: [
    "怎么算钱",
    "怎么计费",
    "怎么收费",
    "按什么收费",
    "怎么收费",
    "首重",
    "续重",
    "多少钱",
    "一公斤多少",
    "每kg",
    "每公斤",
    "一方多少",
    "体积怎么算",
    "重量怎么算",
    "计费规则",
    "运费",
    "报价",
    "价格",
    "费用",
    "收费标准",
    "怎么算运费",
  ],
  发货寄件: [
    "发货",
    "寄件",
    "怎么寄",
    "怎么发",
    "如何寄",
    "如何发货",
    "我要寄",
    "想寄",
    "想发货",
    "下单",
    "打包",
    "取件",
    "上门取",
    "交运",
    "出货",
    "寄到",
    "发到泰国",
    "寄去",
    "可以寄吗",
    "收件地址",
  ],
  快递时效: [
    "多久到",
    "什么时候到",
    "几天到",
    "多久能收到",
    "几时到货",
    "还要多久",
    "什么时候派送",
    "多久派送",
    "什么时候送达",
    "多久送达",
    "大概几天",
    "要等多久",
    "时效",
    "多长时间",
    "几天能到",
    "几天才能到",
    "还要几天",
    "何时能到",
    "什么时候能拿到",
    "还要等几天",
    "啥时候到",
    "多久才到",
  ],
  丢件理赔: [
    "丢件",
    "弄丢",
    "不见了",
    "丢失",
    "货没了",
    "件不见了",
    "包裹丢了",
    "货物丢失",
    "快件遗失",
    "一直没更新",
    "很久没动态",
    "物流不动",
    "一直不动",
    "物流一直不",
    "一直没派送",
    "一直查不到",
    "货一直没到",
    "凭空消失",
    "找不到包裹",
    "查不到物流",
    "理赔",
    "赔偿",
    "怎么赔",
    "赔付",
    "赔钱",
    "丢了怎么办",
    "丢件怎么处理",
    "有没有补偿",
  ],
  访问频道: [
    "访问频道",
    "进频道",
    "通知频道",
    "打开频道",
    "进入群聊",
    "进群",
    "频道入口",
    "频道在哪",
    "频道链接",
    "怎么进频道",
    "频道地址",
    "频道二维码",
    "群链接",
    "拉我进频道",
    "邀请我进频道",
    "频道怎么进",
    "怎么访问你们的频道",
    "有频道吗",
    "官方频道",
  ],
};

const BUSINESS_CATEGORIES = [
  "丢件理赔",
  "查快递",
  "快递时效",
  "费用价格咨询",
  "发货寄件",
  "访问频道",
];

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u3000]/g, " ")
    .replace(/[？?！!。，,、；;：:\s]+/g, " ")
    .replace(/[“”"'‘’]/g, "")
    .trim();
}

function scoreCues(normalized, cues) {
  let score = 0;
  let hits = 0;
  for (const cue of cues) {
    const needle = normalizeText(cue);
    if (!needle) {
      continue;
    }
    if (normalized.includes(needle) || normalized.replace(/\s/g, "").includes(needle.replace(/\s/g, ""))) {
      hits += 1;
      score += Math.min(needle.length, 16) + (needle.length >= 4 ? 4 : 1);
    }
  }
  return { score, hits };
}

function classifyIntent(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return FALLBACK_KEYWORD;
  }

  const scores = {};
  for (const category of CATEGORIES) {
    const { score, hits } = scoreCues(normalized, CUES[category] || []);
    scores[category] = hits > 0 ? score : 0;
  }

  const businessScore = BUSINESS_CATEGORIES.reduce((max, id) => Math.max(max, scores[id] || 0), 0);
  if (businessScore > 0) {
    scores["打招呼问候"] = 0;
  }

  let best = FALLBACK_KEYWORD;
  let bestScore = 0;
  const order = [...BUSINESS_CATEGORIES, "打招呼问候", "未知问题"];
  for (const category of order) {
    const score = scores[category] || 0;
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }

  if (bestScore < 3) {
    return FALLBACK_KEYWORD;
  }
  return best;
}

module.exports = {
  CATEGORIES,
  FALLBACK_KEYWORD,
  LOOKUP_KEYS,
  classifyIntent,
  normalizeText,
};
