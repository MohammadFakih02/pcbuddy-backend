import { prisma } from '../prisma'
import { hashPassword, verifyPassword } from '../utils/password'
import { LoginDto, RegisterDto } from '../types/auth'

export class AuthService {
  async register(data: RegisterDto) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    })

    if (existingUser) {
      throw new Error('User already exists with the provided email or username')
    }

    const hashedPassword = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    })

    return user
  }

  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      throw new Error('Invalid credentials: User not found')
    }

    const isValidPassword = await verifyPassword(data.password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials: Incorrect password')
    }

    return user
  }
}