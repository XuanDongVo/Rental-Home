import { MessageStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Gửi tin nhắn mới
 */
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
) => {
  // Sắp xếp IDs để đảm bảo tính nhất quán khi tạo chat
  const [participant1Id, participant2Id] = [senderId, receiverId].sort();

  // Tìm hoặc tạo chat
  const chat = await prisma.chat.upsert({
    where: {
      participant1Id_participant2Id: {
        participant1Id,
        participant2Id,
      },
    },
    update: {
      lastMessageAt: new Date(),
    },
    create: {
      participant1Id,
      participant2Id,
    },
  });

  // Tạo tin nhắn mới
  const message = await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId,
      content,
      status: MessageStatus.Sent,
    },
  });

  return message;
};

/**
 * Lấy lịch sử chat giữa hai người dùng
 */
export const getChatHistory = async (user1: string, user2: string) => {
  // Sắp xếp IDs để đảm bảo tính nhất quán
  const [participant1Id, participant2Id] = [user1, user2].sort();

  // Tìm chat
  const chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id,
        participant2Id,
      },
    },
  });

  if (!chat) return [];

  // Lấy các tin nhắn không bị xóa đối với user1
  const messages = await prisma.message.findMany({
    where: {
      chatId: chat.id,
      NOT: {
        isRecalled: true,
      },
    },
    include: {
      editHistory: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Transform messages để đảm bảo định dạng dữ liệu
  return messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    isRead: Boolean(message.isRead),
    isEdited: Boolean(message.isEdited),
    isRecalled: Boolean(message.isRecalled),
    // Ẩn nội dung nếu tin nhắn bị thu hồi
    content: message.isRecalled ? "Tin nhắn đã bị thu hồi" : message.content,
  }));
};

/**
 * Tìm kiếm người dùng
 */
export const searchUsers = async (query: string, excludeUserId?: string) => {
  const q = query.trim();
  console.log(
    "Searching users with query:",
    q,
    "excludeUserId:",
    excludeUserId
  );

  if (!q) return [] as Array<any>;

  // Search in both tenants and managers
  const [tenants, managers] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        AND: [
          excludeUserId ? { cognitoId: { not: excludeUserId } } : {},
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
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
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true, cognitoId: true },
      take: 10,
    }),
  ]);

  const mappedTenants = tenants.map((t) => ({
    type: "tenant" as const,
    id: t.id,
    name: t.name,
    email: t.email,
    cognitoId: t.cognitoId,
  }));

  const mappedManagers = managers.map((m) => ({
    type: "manager" as const,
    id: m.id,
    name: m.name,
    email: m.email,
    cognitoId: m.cognitoId,
  }));

  return [...mappedTenants, ...mappedManagers];
};

/**
 * Lấy danh sách các cuộc hội thoại của người dùng
 */
export const getConversations = async (userId: string) => {
  // Lấy tất cả các chat mà người dùng tham gia
  const chats = await prisma.chat.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        where: {
          NOT: {
            isRecalled: true,
          },
        },
      },
    },
  });

  // Lấy IDs của tất cả người dùng tham gia các cuộc hội thoại
  const peerIds = chats.map((chat) => {
    return chat.participant1Id === userId
      ? chat.participant2Id
      : chat.participant1Id;
  });

  // Lấy thông tin người dùng
  const [tenantPeers, managerPeers] = await Promise.all([
    prisma.tenant.findMany({
      where: { cognitoId: { in: peerIds } },
      select: { cognitoId: true, name: true, email: true },
    }),
    prisma.manager.findMany({
      where: { cognitoId: { in: peerIds } },
      select: { cognitoId: true, name: true, email: true },
    }),
  ]);

  // Tạo map thông tin người dùng
  const infoMap = new Map();
  tenantPeers.forEach((t) =>
    infoMap.set(t.cognitoId, { name: t.name, email: t.email, type: "tenant" })
  );
  managerPeers.forEach((m) =>
    infoMap.set(m.cognitoId, {
      name: m.name,
      email: m.email,
      type: "manager",
    })
  );

  // Format kết quả
  return chats
    .filter((chat) => chat.messages.length > 0)
    .map((chat) => {
      const peerId =
        chat.participant1Id === userId
          ? chat.participant2Id
          : chat.participant1Id;
      const info = infoMap.get(peerId);
      const lastMessage = chat.messages[0];

      return {
        chatId: chat.id,
        peerId: peerId,
        name: info?.name || peerId,
        email: info?.email || "",
        type: (info?.type || "tenant") as "tenant" | "manager",
        lastMessage: {
          id: lastMessage.id,
          content: lastMessage.isRecalled
            ? "Tin nhắn đã bị thu hồi"
            : lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt.toISOString(),
          isRead: Boolean(lastMessage.isRead),
          isEdited: Boolean(lastMessage.isEdited),
          isRecalled: Boolean(lastMessage.isRecalled),
        },
      };
    });
};

/**
 * Lấy thông tin người dùng theo ID
 */
export const getUserById = async (cognitoId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { cognitoId },
    select: { cognitoId: true, name: true, email: true },
  });
  if (tenant) return { type: "tenant" as const, ...tenant };

  const manager = await prisma.manager.findUnique({
    where: { cognitoId },
    select: { cognitoId: true, name: true, email: true },
  });
  if (manager) return { type: "manager" as const, ...manager };

  return null;
};

/**
 * Đánh dấu tin nhắn đã đọc
 */
export const markMessagesAsRead = async (chatId: string, userId: string) => {
  // Kiểm tra người dùng có quyền truy cập chat không
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
  });

  if (!chat) return { count: 0 };

  // Lấy ID của người gửi (không phải userId)
  const senderId =
    chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;

  // Đánh dấu tất cả tin nhắn từ người kia gửi đến là đã đọc
  return prisma.message.updateMany({
    where: {
      chatId: chatId,
      senderId: senderId,
      isRead: false,
    },
    data: {
      isRead: true,
      status: MessageStatus.Read,
    },
  });
};

/**
 * Đếm số lượng tin nhắn chưa đọc
 */
export const getUnreadMessageCount = async (userId: string) => {
  // Lấy tất cả chat mà người dùng tham gia
  const chats = await prisma.chat.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    select: { id: true },
  });

  const chatIds = chats.map((chat) => chat.id);

  // Đếm tổng số tin nhắn chưa đọc trong tất cả các chat
  return prisma.message.count({
    where: {
      chatId: { in: chatIds },
      senderId: { not: userId }, // Tin nhắn từ người khác gửi đến
      isRead: false,
      NOT: {
       isRecalled: true
      },
    },
  });
};

/**
 * Chỉnh sửa tin nhắn (chỉ người gửi mới có quyền chỉnh sửa)
 */
export const editMessage = async (
  messageId: number,
  userId: string,
  newContent: string
) => {
  // Tìm tin nhắn
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  // Kiểm tra quyền chỉnh sửa
  if (!message || message.senderId !== userId) {
    throw new Error("Không có quyền chỉnh sửa tin nhắn này");
  }

  // Kiểm tra nếu tin nhắn đã bị thu hồi
  if (message.isRecalled) {
    throw new Error("Không thể chỉnh sửa tin nhắn đã bị thu hồi");
  }

  // Thực hiện chỉnh sửa trong transaction
  return prisma.$transaction([
    // Lưu phiên bản cũ vào lịch sử
    prisma.messageEdit.create({
      data: {
        messageId: messageId,
        previousContent: message.content,
      },
    }),
    // Cập nhật tin nhắn với nội dung mới
    prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
        status: MessageStatus.Edited,
      },
    }),
  ]);
};

/**
 * Thu hồi tin nhắn (chỉ người gửi mới có quyền thu hồi)
 */
export const recallMessage = async (messageId: number, userId: string) => {
  // Tìm tin nhắn
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  // Kiểm tra quyền thu hồi
  if (!message || message.senderId !== userId) {
    throw new Error("Không có quyền thu hồi tin nhắn này");
  }

  // Thực hiện thu hồi tin nhắn
  return prisma.message.update({
    where: { id: messageId },
    data: {
      isRecalled: true,
      status: MessageStatus.Recalled,
    },
  });
};

/**
 * Xóa tin nhắn cho người dùng hiện tại (không ảnh hưởng đến người khác)
 */
export const deleteMessageForMe = async (messageId: number, userId: string) => {
  // Tìm tin nhắn
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  // Thêm userId vào mảng deletedFor
  return prisma.message.update({
    where: { id: messageId },
    data: {
      deletedFor: {
        push: userId,
      },
    },
  });
};

/**
 * Lấy lịch sử chỉnh sửa của tin nhắn
 */
export const getMessageEditHistory = async (
  messageId: number,
  userId: string
) => {
  // Tìm tin nhắn
  console.log("by userId:", userId);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      chat: true,
    },
  });

  // Kiểm tra quyền truy cập
  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  console.log("Message fetched:", message);

  // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện
  if (
    message.chat.participant1Id !== userId &&
    message.chat.participant2Id !== userId
  ) {
    throw new Error("Không có quyền xem lịch sử chỉnh sửa");
  }

  // Lấy lịch sử chỉnh sửa
  const editHistory = await prisma.messageEdit.findMany({
    where: {
      messageId: messageId,
    },
    orderBy: {
      editedAt: "desc",
    },
  });

  return editHistory.map((edit) => ({
    ...edit,
    editedAt: edit.editedAt.toISOString(),
  }));
};
