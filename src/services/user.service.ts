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

  async updateProfile(userId: number, updateData: { name?: string; bio?: string }) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: updateData.name,
        bio: updateData.bio,
      },
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
  
    return updatedUser;
  }

    async getUsersCount() {
        return await prisma.user.count();
    }

    async getActiveUsers() {
        return await prisma.user.count({
            where: { isOnline: true },
        });
    }
}