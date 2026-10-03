import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { google } from 'googleapis';
import zlib from 'zlib';

// OAuth2 Credentials from environment variables
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';
const CRON_SECRET = process.env.CRON_SECRET || 'MY_SUPER_SECRET_CRON_KEY_123';

// Need a separate prisma instance for the route since it might run concurrently
const prisma = new PrismaClient();

export async function GET(req: Request) {
  // Security check: only allow execution if the correct secret is provided
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('API: Starting automated database backup...');
  
  try {
    // 1. Fetch data
    // Dynamically fetch all models from Prisma schema
    const modelNames = Prisma.dmmf.datamodel.models.map(m => m.name);
    
    const dbDump: Record<string, any> = {
      timestamp: new Date().toISOString()
    };

    // Iterate through all models and fetch their data
    for (const modelName of modelNames) {
      // Prisma client uses camelCase for model names (e.g., 'user', 'configValue')
      const camelCaseModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      // @ts-ignore - dynamic access
      dbDump[modelName] = await prisma[camelCaseModel].findMany();
    }

    const jsonString = JSON.stringify(dbDump, null, 2);
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const gzipFileName = `backup-${timestampStr}.json.gz`;

    // 2. Compress into GZIP in-memory (better for serverless than writing to disk)
    const gzipBuffer = await new Promise<Buffer>((resolve, reject) => {
      zlib.gzip(jsonString, (err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    // 3. Upload to Google Drive
    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // We convert the in-memory buffer to a stream for Google API
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(gzipBuffer);
    
    const fileMetadata = {
      name: gzipFileName,
      parents: [FOLDER_ID]
    };
    
    const media = {
      mimeType: 'application/gzip',
      body: bufferStream
    };
    
    const driveRes = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });
    
    // 4. Auto-cleanup: Keep only the last 15 backups
    console.log('Cleaning up old backups...');
    const listRes = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)'
    });
    
    const allBackups = listRes.data.files || [];
    const MAX_BACKUPS = 15;
    
    if (allBackups.length > MAX_BACKUPS) {
      const backupsToDelete = allBackups.slice(MAX_BACKUPS);
      for (const oldBackup of backupsToDelete) {
        if (oldBackup.id) {
          console.log(`Deleting old backup: ${oldBackup.name}`);
          await drive.files.delete({ fileId: oldBackup.id });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Backup successful', 
      fileId: driveRes.data.id 
    });
    
  } catch (error: any) {
    console.error('Backup API failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
