import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Environment variables for DigitalOcean Spaces
const SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT;
const SPACES_BUCKET = process.env.DO_SPACES_BUCKET;
const ACCESS_KEY = process.env.DO_ACCESS_KEY;
const SECRET_KEY = process.env.DO_SECRET_KEY;

if (!SPACES_ENDPOINT || !SPACES_BUCKET || !ACCESS_KEY || !SECRET_KEY) {
  console.error('DigitalOcean Spaces configuration is missing! Check your .env.local file.');
}

// Initialize S3 client for DigitalOcean Spaces
export const doSpacesClient = new S3Client({
  region: 'sgp1', // Singapore region
  endpoint: SPACES_ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY || '',
    secretAccessKey: SECRET_KEY || '',
  },
});

/**
 * Generate a public URL for a file in DigitalOcean Spaces
 */
export function getPublicUrl(fileName: string): string {
  return `${SPACES_ENDPOINT}/${SPACES_BUCKET}/guests/${fileName}`;
}

/**
 * Upload photo to DigitalOcean Spaces
 * @param imageData - Blob data of the image
 * @param guestId - Guest ID for file naming
 */
export async function uploadPhotoToSpaces(imageData: Blob, guestId: string): Promise<string> {
  const extension = 'jpg';
  const fileName = `${Date.now()}-${guestId}.${extension}`;
  
  const command = new PutObjectCommand({
    Bucket: SPACES_BUCKET,
    Key: `guests/${fileName}`,
    Body: imageData,
    ContentType: 'image/jpeg',
    ACL: 'public-read', // Make the file publicly accessible
  });

  try {
    await doSpacesClient.send(command);
    return getPublicUrl(fileName);
  } catch (error) {
    console.error('Error uploading photo to DigitalOcean Spaces:', error);
    throw error;
  }
}

/**
 * Delete photo from DigitalOcean Spaces
 * @param imageUrl - Full URL of the photo to delete
 */
export async function deletePhotoFromSpaces(imageUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const key = urlParts.slice(urlParts.indexOf('guests') + 1).join('/');
    
    const command = new DeleteObjectCommand({
      Bucket: SPACES_BUCKET,
      Key: key,
    });

    await doSpacesClient.send(command);
  } catch (error) {
    console.error('Error deleting photo from DigitalOcean Spaces:', error);
    throw error;
  }
}

/**
 * Capture screenshot from video element
 * @param videoElement - HTMLVideoElement containing webcam stream
 */
export async function captureScreenshot(videoElement: HTMLVideoElement): Promise<Blob | null> {
  if (!videoElement) return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}
