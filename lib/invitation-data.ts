// 招待データ

export interface Invitation {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImageUrl?: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  invitedAt: string;
  status: "pending" | "accepted" | "declined" | "maybe";
  message?: string;
}

export const mockInvitations: Invitation[] = [
  {
    id: "inv1",
    eventId: "1",
    eventTitle: "週末BBQパーティー🔥",
    eventImageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop",
    organizerId: "user1",
    organizerName: "さくら",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
    invitedAt: "2026-03-08T10:00:00",
    status: "pending",
    message: "一緒にBBQ楽しみましょう！🍖",
  },
  {
    id: "inv2",
    eventId: "2",
    eventTitle: "ボードゲームナイト🎲",
    eventImageUrl: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop",
    organizerId: "user2",
    organizerName: "けんた",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kenta",
    invitedAt: "2026-03-07T15:30:00",
    status: "pending",
    message: "ボードゲーム好きなら絶対楽しめます！",
  },
  {
    id: "inv3",
    eventId: "3",
    eventTitle: "深夜カラオケ🎤",
    eventImageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
    organizerId: "user3",
    organizerName: "あやか",
    organizerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ayaka",
    invitedAt: "2026-03-06T22:00:00",
    status: "accepted",
  },
];
