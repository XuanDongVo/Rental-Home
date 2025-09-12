import prisma from '../lib/prisma';

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  return prisma.message.create({
    data: { senderId, receiverId, content },
  });
};

export const getChatHistory = async (user1: string, user2: string) => {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const searchUsers = async (query: string, excludeUserId?: string) => {
  const q = query.trim();
  if (!q) return [] as Array<any>;

  const [tenants, managers]: [
    Array<{ id: number; name: string; email: string; cognitoId: string }>,
    Array<{ id: number; name: string; email: string; cognitoId: string }>
  ] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        AND: [
          excludeUserId ? { cognitoId: { not: excludeUserId } } : {},
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true, cognitoId: true },
      take: 10,
    }),
    prisma.manager.findMany({
      where: {
        AND: [
          excludeUserId ? { cognitoId: { not: excludeUserId } } : {},
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true, cognitoId: true },
      take: 10,
    }),
  ]);

  const mappedTenants = tenants.map((t: { id: number; name: string; email: string; cognitoId: string }) => ({
    type: 'tenant' as const,
    id: t.id,
    name: t.name,
    email: t.email,
    cognitoId: t.cognitoId,
  }));

  const mappedManagers = managers.map((m: { id: number; name: string; email: string; cognitoId: string }) => ({
    type: 'manager' as const,
    id: m.id,
    name: m.name,
    email: m.email,
    cognitoId: m.cognitoId,
  }));

  return [...mappedTenants, ...mappedManagers];
};

export const getConversations = async (userId: string) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });

  const peerSet = new Set<string>();
  for (const m of messages) {
    const peer = m.senderId === userId ? m.receiverId : m.senderId;
    if (peer) peerSet.add(peer);
  }

  const peers = Array.from(peerSet);
  const latestPerPeer = await Promise.all(
    peers.map(async (peerId: string) => {
      const last = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: peerId },
            { senderId: peerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      return { peerId, lastMessage: last } as { peerId: string; lastMessage: { id: number; content: string; senderId: string; receiverId: string; createdAt: Date } | null };
    })
  );

  const tenantPeers: Array<{ cognitoId: string; name: string; email: string }> = await prisma.tenant.findMany({
    where: { cognitoId: { in: peers } },
    select: { cognitoId: true, name: true, email: true },
  });
  const managerPeers: Array<{ cognitoId: string; name: string; email: string }> = await prisma.manager.findMany({
    where: { cognitoId: { in: peers } },
    select: { cognitoId: true, name: true, email: true },
  });
  const infoMap = new Map<string, { name: string; email: string; type: 'tenant' | 'manager' }>();
  tenantPeers.forEach((t: { cognitoId: string; name: string; email: string }) => infoMap.set(t.cognitoId, { name: t.name, email: t.email, type: 'tenant' }));
  managerPeers.forEach((m: { cognitoId: string; name: string; email: string }) => infoMap.set(m.cognitoId, { name: m.name, email: m.email, type: 'manager' }));

  return latestPerPeer
    .filter((x) => !!x.lastMessage)
    .sort((a, b) => (a.lastMessage && b.lastMessage ? (b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()) : 0))
    .map((x) => {
      const info = infoMap.get(x.peerId);
      return {
        peerId: x.peerId,
        name: info?.name || x.peerId,
        email: info?.email || '',
        type: (info?.type || 'tenant') as 'tenant' | 'manager',
        lastMessage: {
          id: (x.lastMessage as any).id,
          content: (x.lastMessage as any).content,
          senderId: (x.lastMessage as any).senderId,
          receiverId: (x.lastMessage as any).receiverId,
          createdAt: (x.lastMessage as any).createdAt,
        },
      };
    });
};

export const getUserById = async (cognitoId: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { cognitoId }, select: { cognitoId: true, name: true, email: true } });
  if (tenant) return { type: 'tenant' as const, ...tenant };
  const manager = await prisma.manager.findUnique({ where: { cognitoId }, select: { cognitoId: true, name: true, email: true } });
  if (manager) return { type: 'manager' as const, ...manager };
  return null;
};
