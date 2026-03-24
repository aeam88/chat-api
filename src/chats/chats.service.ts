import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Chat, Prisma } from '../generated/prisma/client';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateDirectChat(userIds: string[], currentUserId: string): Promise<Chat> {
    const allUserIds = [...new Set([...userIds, currentUserId])];
    
    if (allUserIds.length !== 2) {
       throw new ConflictException('Direct chat must have exactly 2 participants');
    }

    // Find if a direct chat already exists between these two users
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: allUserIds },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) {
      return existingChat as any;
    }

    // Create new direct chat
    return this.prisma.chat.create({
      data: {
        isGroup: false,
        participants: {
          create: allUserIds.map(id => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });
  }

  async createGroupChat(name: string, userIds: string[], currentUserId: string): Promise<Chat> {
    const allUserIds = [...new Set([...userIds, currentUserId])];

    return this.prisma.chat.create({
      data: {
        isGroup: true,
        name: name || 'Group Chat',
        participants: {
          create: allUserIds.map(id => ({
            userId: id,
            isAdmin: id === currentUserId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
        lastMessage: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
        messages: {
           take: 50,
           orderBy: {
              createdAt: 'desc',
           },
           include: {
              sender: {
                 select: {
                    id: true,
                    username: true,
                 }
              }
           }
        }
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = chat.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ConflictException('You are not a participant in this chat');
    }

    return chat;
  }
}
