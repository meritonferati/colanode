import { S3Client } from '@aws-sdk/client-s3';

const AVATARS_STORAGE_ENDPOINT = process.env.AVATARS_STORAGE_ENDPOINT;
const AVATARS_STORAGE_BUCKET_NAME = process.env.AVATARS_STORAGE_BUCKET_NAME;
const AVATARS_STORAGE_REGION = process.env.AVATARS_STORAGE_REGION;
const AVATARS_STORAGE_ACCESS_KEY = process.env.AVATARS_STORAGE_ACCESS_KEY;
const AVATARS_STORAGE_SECRET_KEY = process.env.AVATARS_STORAGE_SECRET_KEY;

if (
  !AVATARS_STORAGE_ENDPOINT ||
  !AVATARS_STORAGE_ACCESS_KEY ||
  !AVATARS_STORAGE_SECRET_KEY ||
  !AVATARS_STORAGE_BUCKET_NAME ||
  !AVATARS_STORAGE_REGION
) {
  throw new Error('Avatar storage credentials not set');
}

export const avatarStorage = new S3Client({
  endpoint: AVATARS_STORAGE_ENDPOINT,
  region: AVATARS_STORAGE_REGION,
  credentials: {
    accessKeyId: AVATARS_STORAGE_ACCESS_KEY,
    secretAccessKey: AVATARS_STORAGE_SECRET_KEY,
  },
});

export const BUCKET_NAMES = {
  AVATARS: AVATARS_STORAGE_BUCKET_NAME,
};
