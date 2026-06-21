"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const SPACES_ENDPOINT = process.env.NEXT_PUBLIC_DO_SPACES_ENDPOINT;
const SPACES_BUCKET = process.env.DO_SPACES_BUCKET;
const ACCESS_KEY = process.env.DO_ACCESS_KEY;
const SECRET_KEY = process.env.DO_SECRET_KEY;

let doSpacesClient: S3Client | null = null;

if (SPACES_ENDPOINT && SPACES_BUCKET && ACCESS_KEY && SECRET_KEY) {
  doSpacesClient = new S3Client({
    region: 'sgp1',
    endpoint: SPACES_ENDPOINT,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
  });
} else {
  console.error("DigitalOcean Spaces credentials missing in Server Action!");
}

function getPublicUrl(fileName: string): string {
  return `${SPACES_ENDPOINT}/${SPACES_BUCKET}/guests/${fileName}`;
}

export async function uploadBase64ToSpaces(base64Data: string, guestId: string): Promise<string> {
  if (!doSpacesClient) {
    console.warn("DigitalOcean Spaces is not configured. Saving photo as Base64 Data URL instead.");
    return base64Data; // Fallback to Data URL if DO Spaces is not configured
  }

  try {
    const base64Content = base64Data.split(',')[1] || base64Data;
    const buffer = Buffer.from(base64Content, 'base64');
    
    const extension = 'jpg';
    const fileName = `${Date.now()}-${guestId}.${extension}`;
    
    const command = new PutObjectCommand({
      Bucket: SPACES_BUCKET,
      Key: `guests/${fileName}`,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });

    await doSpacesClient.send(command);
    return getPublicUrl(fileName);
  } catch (error) {
    console.error('Error uploading photo to DigitalOcean Spaces:', error);
    throw new Error('Gagal mengupload foto ke penyimpanan awan.');
  }
}

export async function deletePhotoFromSpacesServer(imageUrl: string): Promise<boolean> {
  if (imageUrl.startsWith('data:')) {
    // It's a base64 string stored directly, nothing to delete on DigitalOcean
    return true;
  }

  if (!doSpacesClient) {
    console.warn("DigitalOcean Spaces is not configured. Skipping file deletion.");
    return true;
  }

  try {
    const urlParts = imageUrl.split('/');
    const keyIndex = urlParts.indexOf('guests');
    if (keyIndex === -1) return false;
    
    const key = urlParts.slice(keyIndex).join('/');
    
    const command = new DeleteObjectCommand({
      Bucket: SPACES_BUCKET,
      Key: key,
    });

    await doSpacesClient.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting photo from DigitalOcean Spaces:', error);
    throw new Error('Gagal menghapus foto dari penyimpanan awan.');
  }
}
