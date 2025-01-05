import { randomUUID } from 'crypto';
import { join } from 'path';
import { unlink } from 'fs/promises';

const uploadDir = join(__dirname, '../../uploads/profile-pictures');

export const saveFile = async (file: File): Promise<string> => {
  const fileName = `${randomUUID()}-${file.name}`;
  const filePath = join(uploadDir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  await Bun.write(filePath, arrayBuffer);

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:1889';
  return `${backendUrl}/uploads/profile-pictures/${fileName}`;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const absolutePath = join(__dirname, '../../', filePath);
  await unlink(absolutePath);
};