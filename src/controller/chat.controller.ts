import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { ServerWebSocket } from 'bun';

interface WSMessage {
    type: 'message' | 'status' | 'switch_chat' | 'chat_history' | 'error';
    content: string;
    chatId?: number;
    messages?: any[];
    reconnectionId?: number;
     senderId?: number;
}

interface WSData {
    userId: number;
    reconnectionId?: number;
}

const MAX_CHATS_PER_ENGINEER = 5;
const DISCONNECT_TIMEOUT = 5000; // 5 seconds

class ChatControllerClass {
    private prisma: PrismaClient;
    private connections: Map<number, ServerWebSocket<WSData>>;
    private engineerChats: Map<number, Set<number>>;
    private reconnectionMap: Map<number, number>;
    private disconnectTimeouts: Map<number, NodeJS.Timeout>;
    private closedChats: Map<number, { chatId: number, closedAt: number }>;

    constructor() {
        this.prisma = new PrismaClient();
        this.connections = new Map();
        this.engineerChats = new Map();
        this.reconnectionMap = new Map();
        this.disconnectTimeouts = new Map();
        this.closedChats = new Map();
    }

    async findAvailableEngineer() {
        console.log('Finding available engineer...');
        const engineers = await this.prisma.user.findMany({
            where: {
                role: 'ENGINEER',
                isOnline: true,
            },
            include: {
                chatsAsEngineer: {
                    where: {
                        status: 'ACTIVE',
                    },
                },
            },
        });

        for (const engineer of engineers) {
            if (engineer.chatsAsEngineer.length < MAX_CHATS_PER_ENGINEER) {
                console.log(`Found available engineer: ${engineer.id}`);
                return engineer;
            }
        }

        console.log('No available engineers found.');
        return null;
    }

    async handleMessage(ws: ServerWebSocket<WSData>, message: string) {
        console.log(`[S] Handling message:`, message);
        try {
            const data: WSMessage = JSON.parse(message);
            const userId = ws.data.userId;
    
            if (data.type === 'message' && data.chatId) {
                console.log(`[S] User ${userId} sent a message to chat ${data.chatId}: ${data.content}`);
                await this.prisma.message.create({
                    data: {
                        content: data.content,
                        chatId: data.chatId,
                        senderId: userId,
                    },
                });
    
                const chat = await this.prisma.chat.findUnique({
                    where: { id: data.chatId },
                    include: { user: true, engineer: true },
                });
    
                if (chat) {
                    const recipientId = userId === chat.userId ? chat.engineerId : chat.userId;
                    const recipientWs = this.connections.get(recipientId);
    
                    if (recipientWs) {
                        console.log(`[S] Forwarding message to recipient ${recipientId}`);
                        recipientWs.send(
                            JSON.stringify({
                                type: 'message',
                                content: data.content,
                                chatId: data.chatId,
                                senderId: userId,
                                timestamp: new Date().toISOString(),
                            })
                        );
                    } else {
                        console.log(`[S] Recipient ${recipientId} is not connected`);
                    }
                }
            } else if (data.type === 'switch_chat' && data.chatId) {
                console.log(`[S] User ${userId} switched to chat ${data.chatId}`);
                const chat = await this.prisma.chat.findUnique({
                    where: { id: data.chatId },
                    include: { user: true, engineer: true },
                });
    
                if (chat) {
                    const user = await this.prisma.user.findUnique({
                        where: { id: userId },
                    });
    
                    if (user?.role === 'ENGINEER' && chat.engineerId === userId) {
                        // Engineer switching to their own chat
                        const messages = await this.prisma.message.findMany({
                            where: { chatId: data.chatId },
                            orderBy: { createdAt: 'asc' },
                        });
    
                        ws.send(
                            JSON.stringify({
                                type: 'chat_history',
                                chatId: data.chatId,
                                messages: messages,
                            })
                        );
                    } else if (user?.role === 'USER' && chat.userId === userId) {
                        // User switching to their own chat
                        const messages = await this.prisma.message.findMany({
                            where: { chatId: data.chatId },
                            orderBy: { createdAt: 'asc' },
                        });
    
                        ws.send(
                            JSON.stringify({
                                type: 'chat_history',
                                chatId: data.chatId,
                                messages: messages,
                            })
                        );
                    }
                }
            }
        } catch (error) {
            console.error('[S] Error processing message:', error);
            ws.send(JSON.stringify({ type: 'error', content: 'Failed to process message' }));
        }
    }

    async handleConnection(ws: ServerWebSocket<WSData>) {
        const userId = ws.data.userId;
        const reconnectionId = ws.data.reconnectionId;
        console.log(`[S] User ${userId} connected with reconnectionId: ${reconnectionId}`);
        try {
            this.connections.set(userId, ws);

            await this.prisma.user.update({
                where: { id: userId },
                data: { isOnline: true },
            });

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (user?.role === 'USER') {
                console.log(`[S] User ${userId} is a regular user`);
                const existingChat = await this.prisma.chat.findFirst({
                    where: {
                        userId: userId,
                        status: 'ACTIVE',
                    },
                    include: {
                        engineer: true,
                    },
                });

                if (existingChat) {
                    console.log(`[S] User ${userId} has an existing chat with engineer ${existingChat.engineerId}`);
                    const engineer = existingChat.engineer;
                    const engineerOnline = this.connections.has(engineer.id);
                    if (reconnectionId && this.reconnectionMap.has(userId) && this.reconnectionMap.get(userId) === reconnectionId) {
                        console.log(`[S] User ${userId} is reconnecting with the same reconnection ID: ${reconnectionId}`);
                        const timeout = this.disconnectTimeouts.get(userId);
                        if (timeout) {
                            clearTimeout(timeout);
                            this.disconnectTimeouts.delete(userId);
                        }
                        const closedChatInfo = this.closedChats.get(userId);
                        if (closedChatInfo && (Date.now() - closedChatInfo.closedAt) < DISCONNECT_TIMEOUT) {
                            console.log(`[S] Reactivating chat ${closedChatInfo.chatId} for user ${userId}`);
                            await this.prisma.chat.update({
                                where: { id: closedChatInfo.chatId },
                                data: { status: 'ACTIVE' },
                            });
                            this.closedChats.delete(userId);
                            ws.send(
                                JSON.stringify({
                                    type: 'status',
                                    content: `Reconnected to engineer ${engineer.id}`,
                                    chatId: closedChatInfo.chatId,
                                })
                            );

                            const engineerWs = this.connections.get(engineer.id);
                            if (engineerWs) {
                                engineerWs.send(
                                    JSON.stringify({
                                        type: 'status',
                                        content: `User ${userId} reconnected`,
                                        chatId: closedChatInfo.chatId,
                                    })
                                );
                            }
                            const messages = await this.prisma.message.findMany({
                                where: { chatId: closedChatInfo.chatId },
                                orderBy: { createdAt: 'asc' },
                            });

                            ws.send(
                                JSON.stringify({
                                    type: 'chat_history',
                                    chatId: closedChatInfo.chatId,
                                    messages: messages,
                                })
                            );
                            return;
                        }
                    } else if (reconnectionId) {
                        this.reconnectionMap.set(userId, reconnectionId);
                    }


                    if (engineerOnline) {
                        console.log(`[S] Engineer ${engineer.id} is online, reconnecting user ${userId}`);
                        ws.send(
                            JSON.stringify({
                                type: 'status',
                                content: `Reconnected to engineer ${engineer.id}`,
                                chatId: existingChat.id,
                            })
                        );

                        const engineerWs = this.connections.get(engineer.id);
                        if (engineerWs) {
                            engineerWs.send(
                                JSON.stringify({
                                    type: 'status',
                                    content: `User ${userId} reconnected`,
                                    chatId: existingChat.id,
                                })
                            );
                        }

                        const messages = await this.prisma.message.findMany({
                            where: { chatId: existingChat.id },
                            orderBy: { createdAt: 'asc' },
                        });

                        ws.send(
                            JSON.stringify({
                                type: 'chat_history',
                                chatId: existingChat.id,
                                messages: messages,
                            })
                        );

                        return;
                    }
                }

                const availableEngineer = await this.findAvailableEngineer();

                if (availableEngineer) {
                    console.log(`[S] Assigning user ${userId} to engineer ${availableEngineer.id}`);
                    const chat = await this.prisma.chat.create({
                        data: {
                            userId: userId,
                            engineerId: availableEngineer.id,
                            status: 'ACTIVE',
                        },
                    });

                    if (!this.engineerChats.has(availableEngineer.id)) {
                        this.engineerChats.set(availableEngineer.id, new Set());
                    }
                    this.engineerChats.get(availableEngineer.id)?.add(chat.id);

                    ws.send(
                        JSON.stringify({
                            type: 'status',
                            content: `Connected with engineer ${availableEngineer.id}`,
                            chatId: chat.id,
                        })
                    );

                    const engineerWs = this.connections.get(availableEngineer.id);
                    if (engineerWs) {
                        engineerWs.send(
                            JSON.stringify({
                                type: 'status',
                                content: `New chat assigned with user ${userId}`,
                                chatId: chat.id,
                            })
                        );
                    }
                } else {
                    console.log(`[S] No available engineers for user ${userId}`);
                }
            }
        } catch (error) {
            console.error('[S] Error in WebSocket open:', error);
            ws.close();
        }
    }

    async handleDisconnection(ws: ServerWebSocket<WSData>) {
        const userId = ws.data.userId;
        console.log(`[S] User ${userId} disconnected`);

        const timeout = setTimeout(async () => {
            try {
                this.connections.delete(userId);

                await this.prisma.user.update({
                    where: { id: userId },
                    data: { isOnline: false },
                });

                const activeChats = await this.prisma.chat.findMany({
                    where: {
                        OR: [{ userId: userId }, { engineerId: userId }],
                                   status: 'ACTIVE',
                               },
                           });
           
                           for (const chat of activeChats) {
                               const otherPartyId = userId === chat.userId ? chat.engineerId : chat.userId;
                               const otherPartyOnline = this.connections.has(otherPartyId);
           
                               if (!otherPartyOnline) {
                                   console.log(`[S] Closing chat ${chat.id} as the other party is offline`);
                                   await this.prisma.chat.update({
                                       where: { id: chat.id },
                                       data: { status: 'CLOSED' },
                                   });
                                   this.closedChats.set(userId, { chatId: chat.id, closedAt: Date.now() });
           
                                   if (this.engineerChats.has(chat.engineerId)) {
                                       this.engineerChats.get(chat.engineerId)?.delete(chat.id);
                                   }
                               }
                           }
                           this.disconnectTimeouts.delete(userId);
                       } catch (error) {
                           console.error('[S] Error in WebSocket close:', error);
                       }
                   }, DISCONNECT_TIMEOUT) as NodeJS.Timeout;
           
                   this.disconnectTimeouts.set(userId, timeout);
               }
           
               async getEngineerChats(engineerId: number) {
                   console.log(`[S] Fetching active chats for engineer ${engineerId}`);
                   return await this.prisma.chat.findMany({
                       where: {
                           engineerId: engineerId,
                           status: 'ACTIVE',
                       },
                       include: {
                           user: {
                               select: {
                                   id: true,
                                   username: true,
                                   profilePicture: true,
                               },
                           },
                           messages: {
                               orderBy: {
                                   createdAt: 'desc',
                               },
                               take: 1,
                           },
                       },
                   });
               }
           }
           
           const chatControllerInstance = new ChatControllerClass();
           
           export const chatController = new Elysia({ prefix: '/chat' }).get(
               '/engineer/:engineerId/chats',
               async ({ params: { engineerId } }) => {
                   return await chatControllerInstance.getEngineerChats(Number(engineerId));
               }
           );
           
           const wsServer = Bun.serve<WSData>({
               port: 1989,
               fetch(req, server) {
                   const url = new URL(req.url);
                   const userId = Number(url.pathname.split('/').pop());
                   const reconnectionId = Number(url.searchParams.get('reconnectionId'));
           
                   if (isNaN(userId)) {
                       console.log('Invalid user ID in WebSocket request');
                       return new Response('Invalid user ID', { status: 400 });
                   }
           
                   console.log(`[S] Incoming WebSocket connection request from user ${userId} with reconnectionId: ${reconnectionId}`);
                   const upgraded = server.upgrade(req, { data: { userId, reconnectionId } });
                   if (!upgraded) {
                       console.log('WebSocket upgrade failed');
                       return new Response('Expected a WebSocket connection', { status: 400 });
                   }
                   return undefined;
               },
               websocket: {
                   message(ws, message) {
                       console.log(`[S] Received message from user ${ws.data.userId}:`, message);
                       return chatControllerInstance.handleMessage(ws, message as string);
                   },
                   open(ws) {
                       console.log(`[S] WebSocket connection opened for user ${ws.data.userId}`);
                       return chatControllerInstance.handleConnection(ws);
                   },
                   close(ws) {
                       console.log(`[S] WebSocket connection closed for user ${ws.data.userId}`);
                       return chatControllerInstance.handleDisconnection(ws);
                   },
               },
           });
           
           console.log('WebSocket server running on port 1989');