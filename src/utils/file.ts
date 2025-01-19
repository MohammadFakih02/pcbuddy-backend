import { randomUUID } from 'crypto';
import { join } from 'path';
import { unlink } from 'fs/promises';

const uploadDir = join(__dirname, '../../uploads/profile-pictures');

export const saveFile = async (file: File): Promise<string> => {
  const sanitizedFileName = file.name.replace(/\s+/g, '');
  const fileName = `${randomUUID()}-${sanitizedFileName}`;
  const filePath = join(uploadDir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  await Bun.write(filePath, arrayBuffer);

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:1889';
  return `${backendUrl}/uploads/profile-pictures/${fileName}`;
};

export const deleteFile = async (fileUrl: string | undefined): Promise<void> => {
  if (!fileUrl) {
    throw new Error('File URL is undefined');
  }

  const fileName = fileUrl.split('/').pop();
  if (!fileName) {
    throw new Error('Invalid file URL');
  }

  const filePath = join(uploadDir, fileName);
  await unlink(filePath);
};