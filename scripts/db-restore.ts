import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();
const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function performRestore() {
  const args = process.argv.slice(2);
  const backupFilePath = args[0];

  if (!backupFilePath) {
    console.error('❌ Error: Please provide the path to the backup file.');
    console.log('Usage: npm run restore <path-to-backup-file.json.gz>');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), backupFilePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Error: File not found at ${fullPath}`);
    process.exit(1);
  }

  console.log(`\n⚠️  WARNING: This will DELELTE ALL CURRENT DATA in the database and replace it with the backup!`);
  const confirm = await askQuestion('Are you absolutely sure you want to proceed? (Type YES to confirm): ');

  if (confirm !== 'YES') {
    console.log('Restore cancelled.');
    process.exit(0);
  }

  try {
    console.log('\nReading and decompressing backup file...');
    
    // Read and decompress
    const isGzip = fullPath.endsWith('.gz');
    let fileContent: string;
    
    if (isGzip) {
      const compressedBuffer = fs.readFileSync(fullPath);
      fileContent = zlib.gunzipSync(compressedBuffer).toString('utf-8');
    } else {
      fileContent = fs.readFileSync(fullPath, 'utf-8');
    }

    const data = JSON.parse(fileContent);
    console.log(`Backup from timestamp: ${data.timestamp}`);

    const modelNames = Prisma.dmmf.datamodel.models.map(m => m.name);
    
    console.log('\nStarting database wipe...');
    
    // Wipe all tables using TRUNCATE CASCADE to handle foreign keys automatically
    // We execute this in a single transaction if possible, or one by one
    for (const modelName of modelNames) {
      // PostgreSQL specific: TRUNCATE TABLE "TableName" CASCADE
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${modelName}" CASCADE;`);
    }
    
    console.log('Database wiped successfully.');
    console.log('\nRestoring data...');

    // Restore data in the exact order defined in schema.prisma 
    // (This automatically handles foreign key dependencies because parents are defined first)
    for (const modelName of modelNames) {
      if (data[modelName] && data[modelName].length > 0) {
        const camelCaseModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        
        // @ts-ignore
        await prisma[camelCaseModel].createMany({ data: data[modelName] });
        console.log(`✅ Restored ${data[modelName].length} ${modelName} records`);
      }
    }

    console.log('\n🎉 Database restore completed successfully!');

  } catch (error) {
    console.error('\n❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

performRestore();
