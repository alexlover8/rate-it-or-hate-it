// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize R2 client (server-side only)
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('filename') as string; // Note: changed from 'path' to 'filename' to match client code

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!path) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    if (!BUCKET_NAME) {
      console.error('Missing R2_BUCKET_NAME environment variable');
      return NextResponse.json({ error: 'Server configuration error: Missing bucket name' }, { status: 500 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload directly to R2
    await R2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000',
      })
    );

    // Return the public URL
    const url = `${PUBLIC_URL}/${path}`;
    console.log('File uploaded successfully:', url);
    
    return NextResponse.json({ url }); // Return "url" instead of "imageUrl" to match client code
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}