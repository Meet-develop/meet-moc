import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    username: "さくら",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    username: "けんた",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kenta",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    username: "あやか",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ayaka",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    username: "たくや",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=takuya",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    username: "みゆき",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=miyuki",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    username: "だいき",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=daiki",
  },
];

const categories = [
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

const allergens = [
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

const events = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    organizerId: users[0].id,
    title: "週末BBQパーティー🔥",
    description:
      "春の陽気の中、お台場でBBQパーティーを開催します！お肉や野菜、ドリンクはこちらで用意します。手ぶらでOK！みんなでワイワイ楽しみましょう🍖",
    eventDate: new Date("2026-03-15"),
    location: "お台場海浜公園",
    priceCents: 3000,
    maxParticipants: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    organizerId: users[1].id,
    title: "ボードゲームナイト🎲",
    description:
      "渋谷のボードゲームカフェで、いろんなゲームを楽しみましょう！初心者大歓迎！人狼、カタン、コードネームなど、人気ゲームが勢揃い。",
    eventDate: new Date("2026-03-12"),
    location: "渋谷カフェ",
    priceCents: 2000,
    maxParticipants: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=600&fit=crop",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    organizerId: users[2].id,
    title: "深夜カラオケ🎤",
    description:
      "仕事終わりに深夜カラオケでストレス発散！好きな曲を順番に歌って盛り上がりましょう。",
    eventDate: new Date("2026-03-10"),
    location: "新宿歌舞伎町",
    priceCents: 2500,
    maxParticipants: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    organizerId: users[3].id,
    title: "朝活ランニング🏃",
    description:
      "皇居周辺をゆったりランニング。初心者もOK、気持ち良い朝を一緒にスタート！",
    eventDate: new Date("2026-03-11"),
    location: "皇居周辺",
    priceCents: 0,
    maxParticipants: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop",
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    organizerId: users[4].id,
    title: "映画鑑賞会🎬",
    description:
      "話題作をみんなで鑑賞。上映後に感想トークも楽しみましょう！",
    eventDate: new Date("2026-03-14"),
    location: "六本木ヒルズ",
    priceCents: 1800,
    maxParticipants: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop",
  },
  {
    id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    organizerId: users[5].id,
    title: "クラフトビール飲み歩き🍺",
    description:
      "恵比寿でクラフトビールを飲み歩き。美味しい一杯を開拓しましょう！",
    eventDate: new Date("2026-03-13"),
    location: "恵比寿周辺",
    priceCents: 3500,
    maxParticipants: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&h=600&fit=crop",
  },
];

const notes = [
  {
    userId: users[0].id,
    message: "今夜暇！",
  },
  {
    userId: users[1].id,
    message: "新橋で飲み中🍺",
  },
  {
    userId: users[2].id,
    message: "カフェなう☕",
  },
  {
    userId: users[3].id,
    message: "誰か遊ぼー",
  },
  {
    userId: users[4].id,
    message: "仕事終わった～",
  },
  {
    userId: users[5].id,
    message: "渋谷いるよ",
  },
];

const eventHashtags = [
  { eventId: events[0].id, tag: "#アウトドア" },
  { eventId: events[0].id, tag: "#酒好きあつまれ" },
  { eventId: events[0].id, tag: "#BBQ" },
  { eventId: events[1].id, tag: "#インドア" },
  { eventId: events[1].id, tag: "#ゲーム好き" },
  { eventId: events[1].id, tag: "#まったり" },
  { eventId: events[2].id, tag: "#深夜勢" },
  { eventId: events[2].id, tag: "#カラオケ" },
  { eventId: events[2].id, tag: "#ストレス発散" },
  { eventId: events[3].id, tag: "#健康志向" },
  { eventId: events[3].id, tag: "#朝活" },
  { eventId: events[3].id, tag: "#ランニング" },
  { eventId: events[4].id, tag: "#インドア" },
  { eventId: events[4].id, tag: "#映画好き" },
  { eventId: events[4].id, tag: "#出会いを求める人向け" },
  { eventId: events[5].id, tag: "#酒好きあつまれ" },
  { eventId: events[5].id, tag: "#グルメ" },
  { eventId: events[5].id, tag: "#出会いを求める人向け" },
];

const eventParticipants = [
  { eventId: events[0].id, userId: users[0].id, status: "confirmed" as const },
  { eventId: events[0].id, userId: users[1].id, status: "confirmed" as const },
  { eventId: events[0].id, userId: users[2].id, status: "maybe" as const },
  { eventId: events[0].id, userId: users[3].id, status: "confirmed" as const },
  { eventId: events[0].id, userId: users[4].id, status: "confirmed" as const },
  { eventId: events[0].id, userId: users[5].id, status: "maybe" as const },
  { eventId: events[1].id, userId: users[1].id, status: "confirmed" as const },
  { eventId: events[1].id, userId: users[2].id, status: "confirmed" as const },
  { eventId: events[1].id, userId: users[4].id, status: "confirmed" as const },
  { eventId: events[1].id, userId: users[5].id, status: "maybe" as const },
  { eventId: events[2].id, userId: users[2].id, status: "confirmed" as const },
  { eventId: events[2].id, userId: users[0].id, status: "confirmed" as const },
  { eventId: events[2].id, userId: users[1].id, status: "maybe" as const },
  { eventId: events[2].id, userId: users[3].id, status: "confirmed" as const },
  { eventId: events[3].id, userId: users[3].id, status: "confirmed" as const },
  { eventId: events[3].id, userId: users[0].id, status: "confirmed" as const },
  { eventId: events[3].id, userId: users[5].id, status: "maybe" as const },
  { eventId: events[4].id, userId: users[4].id, status: "confirmed" as const },
  { eventId: events[4].id, userId: users[1].id, status: "confirmed" as const },
  { eventId: events[4].id, userId: users[2].id, status: "maybe" as const },
  { eventId: events[4].id, userId: users[0].id, status: "confirmed" as const },
  { eventId: events[5].id, userId: users[5].id, status: "confirmed" as const },
  { eventId: events[5].id, userId: users[0].id, status: "confirmed" as const },
  { eventId: events[5].id, userId: users[1].id, status: "maybe" as const },
  { eventId: events[5].id, userId: users[4].id, status: "confirmed" as const },
];

const dateOptions = [
  {
    id: "c1111111-1111-1111-1111-111111111111",
    eventId: events[0].id,
    optionDate: new Date("2026-03-15"),
    startTime: new Date("1970-01-01T11:00:00.000Z"),
    endTime: new Date("1970-01-01T16:00:00.000Z"),
  },
  {
    id: "c2222222-2222-2222-2222-222222222222",
    eventId: events[0].id,
    optionDate: new Date("2026-03-16"),
    startTime: new Date("1970-01-01T11:00:00.000Z"),
    endTime: new Date("1970-01-01T16:00:00.000Z"),
  },
  {
    id: "c3333333-3333-3333-3333-333333333333",
    eventId: events[0].id,
    optionDate: new Date("2026-03-22"),
    startTime: new Date("1970-01-01T11:00:00.000Z"),
    endTime: new Date("1970-01-01T16:00:00.000Z"),
  },
  {
    id: "d1111111-1111-1111-1111-111111111111",
    eventId: events[1].id,
    optionDate: new Date("2026-03-12"),
    startTime: new Date("1970-01-01T18:00:00.000Z"),
    endTime: new Date("1970-01-01T22:00:00.000Z"),
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    eventId: events[1].id,
    optionDate: new Date("2026-03-13"),
    startTime: new Date("1970-01-01T18:00:00.000Z"),
    endTime: new Date("1970-01-01T22:00:00.000Z"),
  },
  {
    id: "e1111111-1111-1111-1111-111111111111",
    eventId: events[2].id,
    optionDate: new Date("2026-03-10"),
    startTime: new Date("1970-01-01T22:00:00.000Z"),
    endTime: new Date("1970-01-02T02:00:00.000Z"),
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    eventId: events[2].id,
    optionDate: new Date("2026-03-11"),
    startTime: new Date("1970-01-01T22:00:00.000Z"),
    endTime: new Date("1970-01-02T02:00:00.000Z"),
  },
  {
    id: "f1111111-1111-1111-1111-111111111111",
    eventId: events[3].id,
    optionDate: new Date("2026-03-11"),
    startTime: new Date("1970-01-01T06:30:00.000Z"),
    endTime: new Date("1970-01-01T08:00:00.000Z"),
  },
  {
    id: "f2222222-2222-2222-2222-222222222222",
    eventId: events[3].id,
    optionDate: new Date("2026-03-12"),
    startTime: new Date("1970-01-01T06:30:00.000Z"),
    endTime: new Date("1970-01-01T08:00:00.000Z"),
  },
  {
    id: "a1111111-1111-1111-1111-111111111111",
    eventId: events[4].id,
    optionDate: new Date("2026-03-14"),
    startTime: new Date("1970-01-01T19:00:00.000Z"),
    endTime: new Date("1970-01-01T21:30:00.000Z"),
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    eventId: events[4].id,
    optionDate: new Date("2026-03-15"),
    startTime: new Date("1970-01-01T19:00:00.000Z"),
    endTime: new Date("1970-01-01T21:30:00.000Z"),
  },
  {
    id: "b1111111-1111-1111-1111-111111111111",
    eventId: events[5].id,
    optionDate: new Date("2026-03-13"),
    startTime: new Date("1970-01-01T18:30:00.000Z"),
    endTime: new Date("1970-01-01T22:00:00.000Z"),
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    eventId: events[5].id,
    optionDate: new Date("2026-03-14"),
    startTime: new Date("1970-01-01T18:30:00.000Z"),
    endTime: new Date("1970-01-01T22:00:00.000Z"),
  },
];

const dateOptionParticipants = [
  { optionId: dateOptions[0].id, userId: users[0].id },
  { optionId: dateOptions[0].id, userId: users[1].id },
  { optionId: dateOptions[0].id, userId: users[3].id },
  { optionId: dateOptions[0].id, userId: users[4].id },
  { optionId: dateOptions[1].id, userId: users[0].id },
  { optionId: dateOptions[1].id, userId: users[2].id },
  { optionId: dateOptions[1].id, userId: users[5].id },
  { optionId: dateOptions[2].id, userId: users[0].id },
  { optionId: dateOptions[2].id, userId: users[2].id },
  { optionId: dateOptions[2].id, userId: users[4].id },
  { optionId: dateOptions[3].id, userId: users[1].id },
  { optionId: dateOptions[3].id, userId: users[2].id },
  { optionId: dateOptions[4].id, userId: users[1].id },
  { optionId: dateOptions[4].id, userId: users[5].id },
  { optionId: dateOptions[5].id, userId: users[2].id },
  { optionId: dateOptions[5].id, userId: users[0].id },
  { optionId: dateOptions[5].id, userId: users[3].id },
  { optionId: dateOptions[6].id, userId: users[2].id },
  { optionId: dateOptions[6].id, userId: users[1].id },
  { optionId: dateOptions[6].id, userId: users[3].id },
  { optionId: dateOptions[7].id, userId: users[3].id },
  { optionId: dateOptions[7].id, userId: users[0].id },
  { optionId: dateOptions[8].id, userId: users[3].id },
  { optionId: dateOptions[8].id, userId: users[5].id },
  { optionId: dateOptions[9].id, userId: users[4].id },
  { optionId: dateOptions[9].id, userId: users[1].id },
  { optionId: dateOptions[10].id, userId: users[4].id },
  { optionId: dateOptions[10].id, userId: users[2].id },
  { optionId: dateOptions[11].id, userId: users[5].id },
  { optionId: dateOptions[11].id, userId: users[0].id },
  { optionId: dateOptions[12].id, userId: users[5].id },
  { optionId: dateOptions[12].id, userId: users[1].id },
];

const invitations = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    eventId: events[0].id,
    organizerId: users[0].id,
    inviteeId: users[3].id,
    status: "pending" as const,
    message: "一緒にBBQ楽しみましょう！🍖",
    invitedAt: new Date("2026-03-08T10:00:00.000Z"),
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    eventId: events[1].id,
    organizerId: users[1].id,
    inviteeId: users[4].id,
    status: "accepted" as const,
    message: "ボードゲーム好きなら絶対楽しめます！",
    invitedAt: new Date("2026-03-07T15:30:00.000Z"),
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    eventId: events[2].id,
    organizerId: users[2].id,
    inviteeId: users[0].id,
    status: "pending" as const,
    message: "深夜だけど楽しもう！",
    invitedAt: new Date("2026-03-06T22:00:00.000Z"),
  },
  {
    id: "e4444444-4444-4444-4444-444444444444",
    eventId: events[4].id,
    organizerId: users[4].id,
    inviteeId: users[1].id,
    status: "pending" as const,
    message: "映画好きならぜひ！",
    invitedAt: new Date("2026-03-08T18:00:00.000Z"),
  },
];

const relationships = [
  {
    userId: users[0].id,
    targetUserId: users[1].id,
    status: "hot" as const,
  },
  {
    userId: users[0].id,
    targetUserId: users[2].id,
    status: "normal" as const,
  },
  {
    userId: users[0].id,
    targetUserId: users[3].id,
    status: "block" as const,
  },
];

const userCategories = [
  { userId: users[0].id, categoryId: "outdoor" },
  { userId: users[0].id, categoryId: "foodie" },
  { userId: users[1].id, categoryId: "indoor" },
  { userId: users[2].id, categoryId: "culture" },
  { userId: users[3].id, categoryId: "sports" },
  { userId: users[4].id, categoryId: "social" },
  { userId: users[5].id, categoryId: "relax" },
];

const userAllergens = [
  { userId: users[0].id, allergenId: "shrimp" },
  { userId: users[1].id, allergenId: "peanut" },
  { userId: users[2].id, allergenId: "wheat" },
];

async function main() {
  await prisma.eventDateOptionParticipant.deleteMany();
  await prisma.eventDateOption.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.eventHashtag.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.note.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.userCategory.deleteMany();
  await prisma.userAllergen.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.allergen.deleteMany();

  await prisma.category.createMany({ data: categories });
  await prisma.allergen.createMany({ data: allergens });

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  await prisma.note.createMany({ data: notes });

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  await prisma.eventHashtag.createMany({ data: eventHashtags });
  await prisma.eventParticipant.createMany({ data: eventParticipants });
  await prisma.eventDateOption.createMany({ data: dateOptions });
  await prisma.eventDateOptionParticipant.createMany({ data: dateOptionParticipants });
  await prisma.invitation.createMany({ data: invitations });
  await prisma.relationship.createMany({ data: relationships });
  await prisma.userCategory.createMany({ data: userCategories });
  await prisma.userAllergen.createMany({ data: userAllergens });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
