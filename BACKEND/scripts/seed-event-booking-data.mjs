/**
 * One-time import of BACKEND/event_booking BSON dump into MongoDB.
 *
 * Usage:
 *   npm run data:seed
 *
 * Env vars:
 *   DATABASE_URL or MONGODB_URI  Mongo connection string (required)
 *   TARGET_DB                    Database name (default: event_booking)
 *   DUMP_DIR                     Path to dump folder (default: ./event_booking)
 *   DROP_EXISTING=true           Drop each collection before import
 *   NON_INTERACTIVE=true         Skip confirmation prompt
 *   BATCH_SIZE                   insertMany batch size (default: 500)
 */

import { createInterface } from 'readline';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { deserialize, EJSON } from 'bson';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const config = {
  mongoUri: process.env.DATABASE_URL || process.env.MONGODB_URI || '',
  targetDb: process.env.TARGET_DB || 'event_booking',
  dumpDir: process.env.DUMP_DIR || join(rootDir, 'event_booking'),
  dropExisting: process.env.DROP_EXISTING === 'true',
  nonInteractive: process.env.NON_INTERACTIVE === 'true',
  batchSize: Number(process.env.BATCH_SIZE || 500),
};

function readBsonDocuments(filePath) {
  const buffer = readFileSync(filePath);
  if (buffer.length === 0) {
    return [];
  }

  const documents = [];
  let offset = 0;

  while (offset < buffer.length) {
    const size = buffer.readInt32LE(offset);
    if (size <= 0 || offset + size > buffer.length) {
      throw new Error(`Invalid BSON at offset ${offset} in ${filePath}`);
    }

    documents.push(deserialize(buffer.subarray(offset, offset + size)));
    offset += size;
  }

  return documents;
}

async function confirmContinue() {
  if (config.nonInteractive) {
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question('Type YES to continue: ', resolve);
  });
  rl.close();

  if (answer.trim() !== 'YES') {
    console.log('Aborted.');
    process.exit(1);
  }
}

async function applyIndexes(collection, metadataPath) {
  if (!existsSync(metadataPath)) {
    return;
  }

  const metadata = EJSON.parse(readFileSync(metadataPath, 'utf8'));

  for (const index of metadata.indexes || []) {
    if (index.name === '_id_') {
      continue;
    }

    const { key, name, unique, sparse, background } = index;
    await collection.createIndex(key, {
      name,
      ...(unique !== undefined && { unique }),
      ...(sparse !== undefined && { sparse }),
      ...(background !== undefined && { background }),
    });
  }
}

async function seedCollection(db, collectionName, bsonPath, metadataPath) {
  const documents = readBsonDocuments(bsonPath);
  const collection = db.collection(collectionName);

  if (config.dropExisting) {
    try {
      await collection.drop();
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
    }
  }

  if (documents.length > 0) {
    for (let i = 0; i < documents.length; i += config.batchSize) {
      const batch = documents.slice(i, i + config.batchSize);
      await collection.insertMany(batch, { ordered: false });
    }
  }

  await applyIndexes(collection, metadataPath);
  return documents.length;
}

async function main() {
  if (!config.mongoUri) {
    console.error('Error: DATABASE_URL or MONGODB_URI is required.');
    process.exit(1);
  }

  if (!existsSync(config.dumpDir)) {
    console.error(`Error: dump directory not found: ${config.dumpDir}`);
    process.exit(1);
  }

  const bsonFiles = readdirSync(config.dumpDir)
    .filter((file) => file.endsWith('.bson'))
    .sort();

  if (bsonFiles.length === 0) {
    console.error(`Error: no .bson files found in ${config.dumpDir}`);
    process.exit(1);
  }

  console.log('MongoDB seed import');
  console.log(`  Dump directory : ${config.dumpDir}`);
  console.log(`  Target database: ${config.targetDb}`);
  console.log(`  Collections    : ${bsonFiles.length}`);
  console.log(`  Drop existing  : ${config.dropExisting}`);

  await confirmContinue();

  const client = new MongoClient(config.mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(config.targetDb);
    let totalDocuments = 0;

    for (const bsonFile of bsonFiles) {
      const collectionName = bsonFile.replace(/\.bson$/, '');
      const bsonPath = join(config.dumpDir, bsonFile);
      const metadataPath = join(config.dumpDir, `${collectionName}.metadata.json`);
      const count = await seedCollection(db, collectionName, bsonPath, metadataPath);

      totalDocuments += count;
      console.log(`  ${collectionName}: ${count} document(s)`);
    }

    console.log(`\nSeed completed. Imported ${totalDocuments} document(s) into "${config.targetDb}".`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
