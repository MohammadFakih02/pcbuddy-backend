import { prisma } from '../prisma';
import { deleteFile } from '../utils/file';

export class UserService {
  async getProfile(userId: number) {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      throw new Error('User not found');
    }

    return userProfile;
  }

  async updateProfile(userId: number, updateData: { username?: string; email?: string; name?: string; bio?: string }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: updateData.username },
          { email: updateData.email },
        ],
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new Error('Username or email already in use');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: updateData.username,
        email: updateData.email,
        name: updateData.name,
        bio: updateData.bio,
      },
    });

    return updatedUser;
  }

  async updateProfilePicture(userId: number, profilePicture: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.profilePicture) {
      await deleteFile(user.profilePicture);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture },
    });

    return updatedUser;
  }
}