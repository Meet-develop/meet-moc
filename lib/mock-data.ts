// モックデータ

export interface Note {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  message: string;
}

export interface Event {
  id: string;
  title: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  date: string;
  location: string;
  hashtags: string[];
  imageUrl?: string;
}

export const mockNotes: Note[] = [
  {
    id: "1",
    userId: "user1",
    username: "さくら",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
    message: "今夜暇！",
  },
  {
    id: "2",
    userId: "user2",
    username: "けんた",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kenta",
    message: "新橋で飲み中🍺",
  },
  {
    id: "3",
    userId: "user3",
    username: "あやか",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ayaka",
    message: "カフェなう☕",
  },
  {
    id: "4",
    userId: "user4",
    username: "たくや",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=takuya",
    message: "誰か遊ぼー",
  },
  {
    id: "5",
    userId: "user5",
    username: "みゆき",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=miyuki",
    message: "仕事終わった～",
  },
  {
    id: "6",
    userId: "user6",
    username: "だいき",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=daiki",
    message: "渋谷いるよ",
  },
];

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "週末BBQパーティー🔥",
    organizerId: "user1",
    organizerName: "さくら",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
    date: "2026-03-15",
    location: "お台場海浜公園",
    hashtags: ["#アウトドア", "#酒好きあつまれ", "#BBQ"],
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
  },
  {
    id: "2",
    title: "ボードゲームナイト🎲",
    organizerId: "user2",
    organizerName: "けんた",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kenta",
    date: "2026-03-12",
    location: "渋谷カフェ",
    hashtags: ["#インドア", "#ゲーム好き", "#まったり"],
    imageUrl: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=600&fit=crop",
  },
  {
    id: "3",
    title: "深夜カラオケ🎤",
    organizerId: "user3",
    organizerName: "あやか",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ayaka",
    date: "2026-03-10",
    location: "新宿歌舞伎町",
    hashtags: ["#深夜勢", "#カラオケ", "#ストレス発散"],
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
  },
  {
    id: "4",
    title: "朝活ランニング🏃",
    organizerId: "user4",
    organizerName: "たくや",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=takuya",
    date: "2026-03-11",
    location: "皇居周辺",
    hashtags: ["#健康志向", "#朝活", "#ランニング"],
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop",
  },
  {
    id: "5",
    title: "映画鑑賞会🎬",
    organizerId: "user5",
    organizerName: "みゆき",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=miyuki",
    date: "2026-03-14",
    location: "六本木ヒルズ",
    hashtags: ["#インドア", "#映画好き", "#出会いを求める人向け"],
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop",
  },
  {
    id: "6",
    title: "クラフトビール飲み歩き🍺",
    organizerId: "user6",
    organizerName: "だいき",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=daiki",
    date: "2026-03-13",
    location: "恵比寿周辺",
    hashtags: ["#酒好きあつまれ", "#グルメ", "#出会いを求める人向け"],
    imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&h=600&fit=crop",
  },
];
