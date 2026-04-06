import { prisma } from "@/lib/prisma";

export const syncApprovedEventFriendships = async (eventId: string) => {
  const approvedParticipants = await prisma.eventParticipant.findMany({
    where: {
      eventId,
      status: "approved",
    },
    select: {
      userId: true,
    },
  });

  const userIds = [
    ...new Set(
      approvedParticipants.map((participant: { userId: string }) => participant.userId)
    ),
  ] as string[];

  if (userIds.length < 2) {
    return 0;
  }

  const friendshipRows: Array<{ userId: string; friendId: string; status: "accepted" }> = [];

  for (let i = 0; i < userIds.length; i += 1) {
    for (let j = i + 1; j < userIds.length; j += 1) {
      const leftUserId = userIds[i];
      const rightUserId = userIds[j];
      friendshipRows.push({ userId: leftUserId, friendId: rightUserId, status: "accepted" });
      friendshipRows.push({ userId: rightUserId, friendId: leftUserId, status: "accepted" });
    }
  }

  if (friendshipRows.length === 0) {
    return 0;
  }

  await prisma.friendship.createMany({
    data: friendshipRows,
    skipDuplicates: true,
  });

  return friendshipRows.length;
};
