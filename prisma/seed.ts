import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    userId: "11111111-1111-1111-1111-111111111111",
    displayName: "さくら",
    avatarIcon: "🌸",
    gender: "female" as const,
    birthDate: new Date("1995-04-12"),
    playFrequency: "high" as const,
    drinkFrequency: "often" as const,
    budgetMin: 2000,
    budgetMax: 6000,
    ngFoods: ["辛いもの"],
    favoriteAreas: ["渋谷", "恵比寿"],
    favoritePlaces: ["クラフトビールバー", "焼き鳥"],
    availability: {
      weekdaySlots: {
        mon: { daytime: false, night: false },
        tue: { daytime: false, night: false },
        wed: { daytime: false, night: true },
        thu: { daytime: false, night: true },
        fri: { daytime: false, night: true },
      },
    },
  },
  {
    userId: "22222222-2222-2222-2222-222222222222",
    displayName: "けんた",
    avatarIcon: "🧢",
    gender: "male" as const,
    birthDate: new Date("1992-11-08"),
    playFrequency: "medium" as const,
    drinkFrequency: "sometimes" as const,
    budgetMin: 1500,
    budgetMax: 4000,
    ngFoods: ["エビ"],
    favoriteAreas: ["新宿", "池袋"],
    favoritePlaces: ["ボードゲームカフェ"],
    availability: {
      weekdaySlots: {
        mon: { daytime: true, night: false },
        tue: { daytime: false, night: false },
        wed: { daytime: true, night: false },
        thu: { daytime: false, night: false },
        fri: { daytime: false, night: true },
      },
    },
  },
  {
    userId: "33333333-3333-3333-3333-333333333333",
    displayName: "あやか",
    avatarIcon: "🎤",
    gender: "female" as const,
    birthDate: new Date("1998-02-20"),
    playFrequency: "high" as const,
    drinkFrequency: "often" as const,
    budgetMin: 1000,
    budgetMax: 5000,
    ngFoods: ["乳製品"],
    favoriteAreas: ["渋谷", "表参道"],
    favoritePlaces: ["カラオケ", "カフェ"],
    availability: {
      weekdaySlots: {
        mon: { daytime: false, night: false },
        tue: { daytime: false, night: false },
        wed: { daytime: false, night: true },
        thu: { daytime: false, night: true },
        fri: { daytime: false, night: true },
      },
    },
  },
  {
    userId: "44444444-4444-4444-4444-444444444444",
    displayName: "たくや",
    avatarIcon: "🏃",
    gender: "male" as const,
    birthDate: new Date("1990-07-03"),
    playFrequency: "medium" as const,
    drinkFrequency: "never" as const,
    budgetMin: 0,
    budgetMax: 3000,
    ngFoods: [],
    favoriteAreas: ["皇居", "日比谷"],
    favoritePlaces: ["ランニング"],
    availability: {
      weekdaySlots: {
        mon: { daytime: true, night: false },
        tue: { daytime: false, night: false },
        wed: { daytime: true, night: false },
        thu: { daytime: false, night: false },
        fri: { daytime: true, night: false },
      },
    },
  },
  {
    userId: "55555555-5555-5555-5555-555555555555",
    displayName: "みゆき",
    avatarIcon: "🎬",
    gender: "female" as const,
    birthDate: new Date("1993-09-15"),
    playFrequency: "low" as const,
    drinkFrequency: "sometimes" as const,
    budgetMin: 1200,
    budgetMax: 3500,
    ngFoods: ["卵"],
    favoriteAreas: ["六本木", "麻布"],
    favoritePlaces: ["映画館", "イタリアン"],
    availability: {
      weekdaySlots: {
        mon: { daytime: false, night: false },
        tue: { daytime: false, night: true },
        wed: { daytime: false, night: false },
        thu: { daytime: false, night: true },
        fri: { daytime: false, night: false },
      },
    },
  },
  {
    userId: "66666666-6666-6666-6666-666666666666",
    displayName: "だいき",
    avatarIcon: "🍺",
    gender: "male" as const,
    birthDate: new Date("1996-01-27"),
    playFrequency: "high" as const,
    drinkFrequency: "often" as const,
    budgetMin: 2500,
    budgetMax: 8000,
    ngFoods: ["カニ"],
    favoriteAreas: ["恵比寿", "中目黒"],
    favoritePlaces: ["クラフトビール", "バル"],
    availability: {
      weekdaySlots: {
        mon: { daytime: false, night: false },
        tue: { daytime: false, night: true },
        wed: { daytime: false, night: false },
        thu: { daytime: false, night: true },
        fri: { daytime: false, night: true },
      },
    },
  },
];

const friendships = [
  { userId: users[0].userId, friendId: users[1].userId, status: "accepted" as const },
  { userId: users[1].userId, friendId: users[0].userId, status: "accepted" as const },
  { userId: users[0].userId, friendId: users[2].userId, status: "accepted" as const },
  { userId: users[2].userId, friendId: users[0].userId, status: "accepted" as const },
  { userId: users[3].userId, friendId: users[0].userId, status: "pending" as const },
];

const favoriteFriends = [
  { userId: users[0].userId, favoriteUserId: users[1].userId },
  { userId: users[0].userId, favoriteUserId: users[2].userId },
];

const events = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    ownerId: users[0].userId,
    purpose: "週末の飲み会",
    visibility: "public" as const,
    capacity: 6,
    status: "open" as const,
    scheduleMode: "candidate" as const,
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    ownerId: users[2].userId,
    purpose: "深夜カラオケ",
    visibility: "limited" as const,
    capacity: 8,
    status: "open" as const,
    scheduleMode: "candidate" as const,
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    ownerId: users[4].userId,
    purpose: "映画鑑賞会",
    visibility: "private" as const,
    capacity: 4,
    status: "confirmed" as const,
    scheduleMode: "fixed" as const,
    fixedStartTime: new Date("2026-03-14T19:00:00.000Z"),
    fixedEndTime: new Date("2026-03-14T21:30:00.000Z"),
    fixedPlaceId: "place_roma_001",
    fixedPlaceName: "六本木シネマ",
    fixedPlaceAddress: "東京都港区六本木1-1-1",
  },
];

const participants = [
  { eventId: events[0].id, userId: users[0].userId, status: "approved" as const, role: "owner" as const },
  { eventId: events[0].id, userId: users[1].userId, status: "approved" as const, role: "guest" as const },
  { eventId: events[0].id, userId: users[2].userId, status: "requested" as const, role: "guest" as const },
  { eventId: events[0].id, userId: users[5].userId, status: "requested" as const, role: "guest" as const },
  { eventId: events[1].id, userId: users[2].userId, status: "approved" as const, role: "owner" as const },
  { eventId: events[1].id, userId: users[0].userId, status: "approved" as const, role: "guest" as const },
  { eventId: events[2].id, userId: users[4].userId, status: "approved" as const, role: "owner" as const },
  { eventId: events[2].id, userId: users[1].userId, status: "approved" as const, role: "guest" as const },
];

const invites = [
  {
    id: "d1111111-1111-1111-1111-111111111111",
    eventId: events[0].id,
    inviterId: users[0].userId,
    inviteeId: users[2].userId,
    token: "invite-token-aaa",
    status: "pending" as const,
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    eventId: events[1].id,
    inviterId: users[2].userId,
    inviteeId: users[5].userId,
    token: "invite-token-bbb",
    status: "pending" as const,
  },
  {
    id: "d3333333-3333-3333-3333-333333333333",
    eventId: events[2].id,
    inviterId: users[4].userId,
    inviteeId: users[3].userId,
    token: "invite-token-ccc",
    status: "accepted" as const,
  },
];

const timeCandidates = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    eventId: events[0].id,
    startTime: new Date("2026-03-15T11:00:00.000Z"),
    endTime: new Date("2026-03-15T14:00:00.000Z"),
    score: 3,
    source: "system" as const,
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    eventId: events[0].id,
    startTime: new Date("2026-03-16T18:00:00.000Z"),
    endTime: new Date("2026-03-16T21:00:00.000Z"),
    score: 5,
    source: "system" as const,
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    eventId: events[0].id,
    startTime: new Date("2026-03-17T19:00:00.000Z"),
    endTime: new Date("2026-03-17T22:00:00.000Z"),
    score: 4,
    source: "proposal" as const,
    proposedBy: users[1].userId,
  },
  {
    id: "e4444444-4444-4444-4444-444444444444",
    eventId: events[1].id,
    startTime: new Date("2026-03-12T22:00:00.000Z"),
    endTime: new Date("2026-03-13T02:00:00.000Z"),
    score: 5,
    source: "system" as const,
  },
  {
    id: "e5555555-5555-5555-5555-555555555555",
    eventId: events[1].id,
    startTime: new Date("2026-03-13T22:00:00.000Z"),
    endTime: new Date("2026-03-14T02:00:00.000Z"),
    score: 4,
    source: "system" as const,
  },
  {
    id: "e6666666-6666-6666-6666-666666666666",
    eventId: events[1].id,
    startTime: new Date("2026-03-14T20:00:00.000Z"),
    endTime: new Date("2026-03-14T23:00:00.000Z"),
    score: 3,
    source: "proposal" as const,
    proposedBy: users[0].userId,
  },
];

const placeCandidates = [
  {
    id: "f1111111-1111-1111-1111-111111111111",
    eventId: events[0].id,
    placeId: "place_ebisu_001",
    name: "恵比寿ビアバル",
    address: "東京都渋谷区恵比寿1-2-3",
    lat: 35.6467,
    lng: 139.7100,
    priceLevel: 2,
    score: 5,
    source: "system" as const,
  },
  {
    id: "f2222222-2222-2222-2222-222222222222",
    eventId: events[0].id,
    placeId: "place_shibuya_002",
    name: "渋谷クラフト横丁",
    address: "東京都渋谷区道玄坂2-4-1",
    lat: 35.6595,
    lng: 139.7005,
    priceLevel: 3,
    score: 4,
    source: "system" as const,
  },
  {
    id: "f3333333-3333-3333-3333-333333333333",
    eventId: events[0].id,
    placeId: "place_nakame_003",
    name: "中目黒バルテラス",
    address: "東京都目黒区上目黒1-5-6",
    lat: 35.6440,
    lng: 139.6995,
    priceLevel: 2,
    score: 3,
    source: "proposal" as const,
    proposedBy: users[2].userId,
  },
  {
    id: "f4444444-4444-4444-4444-444444444444",
    eventId: events[1].id,
    placeId: "place_shinjuku_001",
    name: "新宿カラオケタウン",
    address: "東京都新宿区歌舞伎町1-1-2",
    lat: 35.6947,
    lng: 139.7030,
    priceLevel: 2,
    score: 5,
    source: "system" as const,
  },
  {
    id: "f5555555-5555-5555-5555-555555555555",
    eventId: events[1].id,
    placeId: "place_shibuya_003",
    name: "渋谷カラオケパーク",
    address: "東京都渋谷区宇田川町20-3",
    lat: 35.6620,
    lng: 139.6980,
    priceLevel: 3,
    score: 4,
    source: "system" as const,
  },
  {
    id: "f6666666-6666-6666-6666-666666666666",
    eventId: events[1].id,
    placeId: "place_ike_004",
    name: "池袋ナイトカラオケ",
    address: "東京都豊島区南池袋1-10-5",
    lat: 35.7295,
    lng: 139.7120,
    priceLevel: 2,
    score: 3,
    source: "proposal" as const,
    proposedBy: users[5].userId,
  },
];

const timeVotes = [
  { candidateId: timeCandidates[0].id, userId: users[0].userId, isAvailable: true },
  { candidateId: timeCandidates[0].id, userId: users[1].userId, isAvailable: true },
  { candidateId: timeCandidates[1].id, userId: users[0].userId, isAvailable: true },
  { candidateId: timeCandidates[1].id, userId: users[2].userId, isAvailable: false },
  { candidateId: timeCandidates[2].id, userId: users[1].userId, isAvailable: true },
  { candidateId: timeCandidates[3].id, userId: users[2].userId, isAvailable: true },
  { candidateId: timeCandidates[4].id, userId: users[0].userId, isAvailable: true },
  { candidateId: timeCandidates[5].id, userId: users[5].userId, isAvailable: true },
];

const placeVotes = [
  { candidateId: placeCandidates[0].id, userId: users[0].userId, score: 5 },
  { candidateId: placeCandidates[1].id, userId: users[1].userId, score: 4 },
  { candidateId: placeCandidates[2].id, userId: users[2].userId, score: 3 },
  { candidateId: placeCandidates[3].id, userId: users[2].userId, score: 5 },
  { candidateId: placeCandidates[4].id, userId: users[0].userId, score: 4 },
  { candidateId: placeCandidates[5].id, userId: users[5].userId, score: 3 },
];

const placeCache = [
  {
    query: "恵比寿 クラフトビール",
    response: {
      places: [
        {
          placeId: "place_ebisu_001",
          name: "恵比寿ビアバル",
          address: "東京都渋谷区恵比寿1-2-3",
          lat: 35.6467,
          lng: 139.71,
          priceLevel: 2,
        },
        {
          placeId: "place_shibuya_002",
          name: "渋谷クラフト横丁",
          address: "東京都渋谷区道玄坂2-4-1",
          lat: 35.6595,
          lng: 139.7005,
          priceLevel: 3,
        },
      ],
    },
  },
  {
    query: "新宿 カラオケ",
    response: {
      places: [
        {
          placeId: "place_shinjuku_001",
          name: "新宿カラオケタウン",
          address: "東京都新宿区歌舞伎町1-1-2",
          lat: 35.6947,
          lng: 139.703,
          priceLevel: 2,
        },
        {
          placeId: "place_shibuya_003",
          name: "渋谷カラオケパーク",
          address: "東京都渋谷区宇田川町20-3",
          lat: 35.662,
          lng: 139.698,
          priceLevel: 3,
        },
      ],
    },
  },
];

const notifications = [
  {
    userId: users[0].userId,
    type: "join_requested" as const,
    message: "だいきさんがイベント参加を申請しました。",
    eventId: events[0].id,
  },
  {
    userId: users[2].userId,
    type: "invite_received" as const,
    message: "けんたさんから招待が届きました。",
    eventId: events[0].id,
  },
  {
    userId: users[4].userId,
    type: "event_confirmed" as const,
    message: "映画鑑賞会の日時とお店が確定しました。",
    eventId: events[2].id,
  },
];

async function main() {
  await prisma.eventPlaceVote.deleteMany();
  await prisma.eventTimeVote.deleteMany();
  await prisma.eventPlaceCandidate.deleteMany();
  await prisma.eventTimeCandidate.deleteMany();
  await prisma.eventInvite.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.event.deleteMany();
  await prisma.favoriteFriend.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.placeCache.deleteMany();
  await prisma.profile.deleteMany();

  await prisma.profile.createMany({ data: users });
  await prisma.friendship.createMany({ data: friendships });
  await prisma.favoriteFriend.createMany({ data: favoriteFriends });
  await prisma.event.createMany({ data: events });
  await prisma.eventParticipant.createMany({ data: participants });
  await prisma.eventInvite.createMany({ data: invites });
  await prisma.eventTimeCandidate.createMany({ data: timeCandidates });
  await prisma.eventPlaceCandidate.createMany({ data: placeCandidates });
  await prisma.eventTimeVote.createMany({ data: timeVotes });
  await prisma.eventPlaceVote.createMany({ data: placeVotes });
  await prisma.placeCache.createMany({ data: placeCache });
  await prisma.notification.createMany({ data: notifications });
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
