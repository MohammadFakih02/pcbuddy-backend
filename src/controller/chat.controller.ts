import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'
import { ServerWebSocket } from 'bun'

interface WSMessage {
  type: 'message' | 'status'
  content: string
  chatId?: number
}

interface WSData {
  userId: number
}

class ChatControllerClass {
  private prisma: PrismaClient
  private connections: Map<number, ServerWebSocket<WSData>>
  private engineerChats: Map<number, Set<number>>

  constructor() {
    this.prisma = new PrismaClient()
    this.connections = new Map()
    this.engineerChats = new Map()
  }

  // Handle WebSocket message
  async handleMessage(ws: ServerWebSocket<WSData>, message: string) {
    try {
      const data: WSMessage = JSON.parse(message)
      const userId = ws.data.userId

      if (data.type === 'message' && data.chatId) {
        await this.prisma.message.create({
          data: {
            content: data.content,
            chatId: data.chatId,
            senderId: userId
          }
        })

        const chat = await this.prisma.chat.findUnique({
          where: { id: data.chatId },
          include: { user: true, engineer: true }
        })

        if (chat) {
          const recipientId = userId === chat.userId ? chat.engineerId : chat.userId
          const recipientWs = this.connections.get(recipientId)
          if (recipientWs) {
            recipientWs.send(JSON.stringify({
              type: 'message',
              content: data.content,
              chatId: data.chatId
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error)
      ws.send(JSON.stringify({ type: 'error', content: 'Failed to process message' }))
    }
  }

  // Handle new WebSocket connection
  async handleConnection(ws: ServerWebSocket<WSData>) {
    try {
      const userId = ws.data.userId
      this.connections.set(userId, ws)

      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true }
      })

      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (user?.role === 'USER') {
        const availableEngineer = await this.prisma.user.findFirst({
          where: {
            role: 'ENGINEER',
            isOnline: true
          }
        })

        if (availableEngineer) {
          const chat = await this.prisma.chat.create({
            data: {
              userId: userId,
              engineerId: availableEngineer.id,
              status: 'ACTIVE'
            }
          })

          if (!this.engineerChats.has(availableEngineer.id)) {
            this.engineerChats.set(availableEngineer.id, new Set())
          }
          this.engineerChats.get(availableEngineer.id)?.add(chat.id)

          ws.send(JSON.stringify({
            type: 'status',
            content: `Connected with engineer ${availableEngineer.id}`,
            chatId: chat.id
          }))

          const engineerWs = this.connections.get(availableEngineer.id)
          if (engineerWs) {
            engineerWs.send(JSON.stringify({
              type: 'status',
              content: `New chat assigned with user ${userId}`,
              chatId: chat.id
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error in WebSocket open:', error)
      ws.close()
    }
  }

  // Handle WebSocket disconnection
  async handleDisconnection(ws: ServerWebSocket<WSData>) {
    try {
      const userId = ws.data.userId
      this.connections.delete(userId)

      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false }
      })

      const activeChats = await this.prisma.chat.findMany({
        where: {
          OR: [
            { userId: userId },
            { engineerId: userId }
          ],
          status: 'ACTIVE'
        }
      })

      for (const chat of activeChats) {
        const otherPartyId = userId === chat.userId ? chat.engineerId : chat.userId
        const otherPartyOnline = this.connections.has(otherPartyId)

        if (!otherPartyOnline) {
          await this.prisma.chat.update({
            where: { id: chat.id },
            data: { status: 'CLOSED' }
          })

          if (this.engineerChats.has(chat.engineerId)) {
            this.engineerChats.get(chat.engineerId)?.delete(chat.id)
          }
        }
      }
    } catch (error) {
      console.error('Error in WebSocket close:', error)
    }
  }

  // Get engineer's active chats
  async getEngineerChats(engineerId: number) {
    return await this.prisma.chat.findMany({
      where: {
        engineerId: engineerId,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })
  }
}

const chatControllerInstance = new ChatControllerClass()

// Export the controller as an Elysia plugin
export const chatController = new Elysia({ prefix: '/chat' })
  .get('/engineer/:engineerId/chats', async ({ params: { engineerId } }) => {
    return await chatControllerInstance.getEngineerChats(Number(engineerId))
  })

// Create WebSocket server
const wsServer = Bun.serve<WSData>({
  port: 3001, // You might want to make this configurable via env
  fetch(req, server) {
    const url = new URL(req.url)
    const userId = Number(url.pathname.split('/').pop())
    
    if (isNaN(userId)) {
      return new Response('Invalid user ID', { status: 400 })
    }

    const upgraded = server.upgrade(req, { data: { userId } })
    if (!upgraded) {
      return new Response('Expected a WebSocket connection', { status: 400 })
    }
    return undefined
  },
  websocket: {
    message(ws, message) {
      return chatControllerInstance.handleMessage(ws, message as string)
    },
    open(ws) {
      return chatControllerInstance.handleConnection(ws)
    },
    close(ws) {
      return chatControllerInstance.handleDisconnection(ws)
    }
  }
})

console.log('WebSocket server running on port 3001')