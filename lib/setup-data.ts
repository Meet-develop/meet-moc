// プロフィール登録用のデータ

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export interface Allergen {
  id: string;
  name: string;
  emoji: string;
}

export const categories: Category[] = [
  {
    id: "outdoor",
    name: "アウトドア",
    emoji: "🏕️",
    description: "自然の中でのアクティビティが大好き！",
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "indoor",
    name: "インドア",
    emoji: "🏠",
    description: "お家でのんびり過ごすのが好き",
    color: "from-purple-400 to-pink-500",
  },
  {
    id: "night-owl",
    name: "深夜勢",
    emoji: "🌙",
    description: "夜更かしは日常茶飯事",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "foodie",
    name: "グルメ",
    emoji: "🍽️",
    description: "美味しいものを食べるのが生きがい",
    color: "from-orange-400 to-red-500",
  },
  {
    id: "sports",
    name: "スポーツ",
    emoji: "⚽",
    description: "体を動かすことが大好き",
    color: "from-cyan-400 to-blue-500",
  },
  {
    id: "culture",
    name: "カルチャー",
    emoji: "🎨",
    description: "アート・音楽・映画などの文化が好き",
    color: "from-pink-400 to-purple-500",
  },
  {
    id: "social",
    name: "社交的",
    emoji: "🎉",
    description: "人と会うのが楽しい！",
    color: "from-yellow-400 to-orange-500",
  },
  {
    id: "quiet",
    name: "静かな場所",
    emoji: "📚",
    description: "落ち着いた空間が好き",
    color: "from-slate-400 to-gray-500",
  },
  {
    id: "adventure",
    name: "冒険好き",
    emoji: "🗺️",
    description: "新しい体験にチャレンジしたい",
    color: "from-teal-400 to-cyan-500",
  },
  {
    id: "relax",
    name: "まったり",
    emoji: "☕",
    description: "ゆったりとした時間を過ごしたい",
    color: "from-amber-400 to-yellow-500",
  },
];

export const allergens: Allergen[] = [
  { id: "shrimp", name: "エビ", emoji: "🦐" },
  { id: "crab", name: "カニ", emoji: "🦀" },
  { id: "wheat", name: "小麦", emoji: "🌾" },
  { id: "egg", name: "卵", emoji: "🥚" },
  { id: "milk", name: "乳製品", emoji: "🥛" },
  { id: "peanut", name: "ピーナッツ", emoji: "🥜" },
  { id: "fish", name: "魚", emoji: "🐟" },
  { id: "soy", name: "大豆", emoji: "🫘" },
  { id: "alcohol", name: "アルコール", emoji: "🍺" },
  { id: "spicy", name: "辛いもの", emoji: "🌶️" },
];
