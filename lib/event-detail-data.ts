import { Event } from "./mock-data";

// イベント詳細用の拡張データ
export interface EventDetail extends Event {
  description: string;
  price?: number;
  maxParticipants?: number;
  currentParticipants: number;
  participants: Participant[];
  dateOptions: DateOption[];
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  joinedAt: string;
  status: "confirmed" | "maybe" | "declined";
}

export interface DateOption {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  availableParticipants: string[]; // participant IDs
}

// モックイベント詳細データ
export const mockEventDetails: { [key: string]: EventDetail } = {
  "1": {
    id: "1",
    title: "週末BBQパーティー🔥",
    organizerId: "user1",
    organizerName: "さくら",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
    date: "2026-03-15",
    location: "お台場海浜公園",
    hashtags: ["#アウトドア", "#酒好きあつまれ", "#BBQ"],
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
    description:
      "春の陽気の中、お台場でBBQパーティーを開催します！お肉や野菜、ドリンクはこちらで用意します。手ぶらでOK！みんなでワイワイ楽しみましょう🍖",
    price: 3000,
    maxParticipants: 20,
    currentParticipants: 8,
    participants: [
      {
        id: "user1",
        name: "さくら",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
        joinedAt: "2026-03-01",
        status: "confirmed",
      },
      {
        id: "user2",
        name: "けんた",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kenta",
        joinedAt: "2026-03-02",
        status: "confirmed",
      },
      {
        id: "user3",
        name: "あやか",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ayaka",
        joinedAt: "2026-03-03",
        status: "maybe",
      },
      {
        id: "user4",
        name: "たくや",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=takuya",
        joinedAt: "2026-03-04",
        status: "confirmed",
      },
      {
        id: "user5",
        name: "みゆき",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=miyuki",
        joinedAt: "2026-03-05",
        status: "confirmed",
      },
      {
        id: "user6",
        name: "だいき",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=daiki",
        joinedAt: "2026-03-05",
        status: "maybe",
      },
      {
        id: "user7",
        name: "ゆい",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=yui",
        joinedAt: "2026-03-06",
        status: "confirmed",
      },
      {
        id: "user8",
        name: "りょう",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryo",
        joinedAt: "2026-03-06",
        status: "confirmed",
      },
    ],
    dateOptions: [
      {
        id: "date1",
        date: "2026-03-15",
        startTime: "11:00",
        endTime: "16:00",
        availableParticipants: ["user1", "user2", "user4", "user5", "user7", "user8"],
      },
      {
        id: "date2",
        date: "2026-03-16",
        startTime: "11:00",
        endTime: "16:00",
        availableParticipants: ["user1", "user2", "user3", "user4", "user6"],
      },
      {
        id: "date3",
        date: "2026-03-22",
        startTime: "11:00",
        endTime: "16:00",
        availableParticipants: ["user1", "user3", "user5", "user6", "user7"],
      },
    ],
  },
  "2": {
    id: "2",
    title: "ボードゲームナイト🎲",
    organizerId: "user2",
    organizerName: "けんた",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kenta",
    date: "2026-03-12",
    location: "渋谷カフェ",
    hashtags: ["#インドア", "#ゲーム好き", "#まったり"],
    imageUrl: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=600&fit=crop",
    description:
      "渋谷のボードゲームカフェで、いろんなゲームを楽しみましょう！初心者大歓迎！人狼、カタン、コードネームなど、人気ゲームが勢揃い。",
    price: 2000,
    maxParticipants: 8,
    currentParticipants: 5,
    participants: [
      {
        id: "user2",
        name: "けんた",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kenta",
        joinedAt: "2026-03-01",
        status: "confirmed",
      },
      {
        id: "user3",
        name: "あやか",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ayaka",
        joinedAt: "2026-03-02",
        status: "confirmed",
      },
      {
        id: "user5",
        name: "みゆき",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=miyuki",
        joinedAt: "2026-03-03",
        status: "confirmed",
      },
      {
        id: "user7",
        name: "ゆい",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=yui",
        joinedAt: "2026-03-04",
        status: "maybe",
      },
      {
        id: "user8",
        name: "りょう",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryo",
        joinedAt: "2026-03-05",
        status: "confirmed",
      },
    ],
    dateOptions: [
      {
        id: "date1",
        date: "2026-03-12",
        startTime: "18:00",
        endTime: "22:00",
        availableParticipants: ["user2", "user3", "user5", "user8"],
      },
      {
        id: "date2",
        date: "2026-03-13",
        startTime: "18:00",
        endTime: "22:00",
        availableParticipants: ["user2", "user5", "user7", "user8"],
      },
      {
        id: "date3",
        date: "2026-03-19",
        startTime: "18:00",
        endTime: "22:00",
        availableParticipants: ["user2", "user3", "user7"],
      },
    ],
  },
};
