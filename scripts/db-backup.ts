import { PrismaClient, Prisma } from '@prisma/client';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const prisma = new PrismaClient();
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';

async function performBackup() {
  console.log('Starting automated database backup...');
  
  try {
    // 1. Fetch data from all tables
    console.log('Fetching data from database...');
    // Dynamically fetch all models from Prisma schema
    const modelNames = Prisma.dmmf.datamodel.models.map(m => m.name);
    
    const dbDump: Record<string, any> = {
      timestamp: new Date().toISOString()
    };

    // Iterate through all models and fetch their data
    for (const modelName of modelNames) {
      const camelCaseModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      // @ts-ignore
      dbDump[modelName] = await prisma[camelCaseModel].findMany();
    }

    // 2. Write to a temporary JSON file
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFileName = `backup-${timestampStr}.json`;
    const gzipFileName = `backup-${timestampStr}.json.gz`;
    
    const tempDir = path.join(process.cwd(), 'temp-backup');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const jsonPath = path.join(tempDir, jsonFileName);
    const gzipPath = path.join(tempDir, gzipFileName);
    
    fs.writeFileSync(jsonPath, JSON.stringify(dbDump, null, 2));
    
    // 3. Compress into GZIP
    console.log(`Compressing backup to ${gzipFileName}...`);
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(jsonPath);
      const writeStream = fs.createWriteStream(gzipPath);
      const gzip = zlib.createGzip();
      
      writeStream.on('close', () => resolve(null));
      writeStream.on('error', reject);
      
      readStream.pipe(gzip).pipe(writeStream);
    });

    // 4. Upload to Google Drive
    console.log('Authenticating with Google Drive OAuth2...');
    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });
    
    const drive = google.drive({ version: 'v3', auth });
    
    console.log('Uploading to Google Drive...');
    const fileMetadata = {
      name: gzipFileName,
      parents: [FOLDER_ID]
    };
    
    const media = {
      mimeType: 'application/gzip',
      body: fs.createReadStream(gzipPath)
    };
    
    const driveRes = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });
    
    console.log(`✅ Backup successful! Uploaded to Drive with File ID: ${driveRes.data.id}`);
    
    // 5. Auto-cleanup: Keep only the last 15 backups in Drive
    console.log('Cleaning up old backups from Google Drive...');
    const listRes = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)'
    });
    
    const allBackups = listRes.data.files || [];
    const MAX_BACKUPS = 15;
    
    if (allBackups.length > MAX_BACKUPS) {
      const backupsToDelete = allBackups.slice(MAX_BACKUPS);
      console.log(`Found ${backupsToDelete.length} old backups to delete.`);
      for (const oldBackup of backupsToDelete) {
        if (oldBackup.id) {
          console.log(`Deleting old backup: ${oldBackup.name}`);
          await drive.files.delete({ fileId: oldBackup.id });
        }
      }
    }
    
    // 6. Cleanup temporary local files
    fs.unlinkSync(jsonPath);
    fs.unlinkSync(gzipPath);
    console.log('Cleaned up temporary files.');
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

import cron from 'node-cron';

// Run the backup immediately or schedule it based on arguments
const args = process.argv.slice(2);

if (args.includes('--cron')) {
  console.log('Backup scheduler started. Will run daily at midnight (00:00).');
  // Runs at 00:00 every day
  cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled backup...');
    performBackup();
  });
} else {
  // Run immediately
  performBackup();
}
