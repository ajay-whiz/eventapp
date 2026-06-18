const { MongoClient, ObjectId } = require('mongodb');

async function testPost() {
  const formId = '68c176620643d51905fb0278';
  const body = {
    name: `PostTest ${Date.now()}`,
    description: 'verify categories collection',
    formId,
  };

  const res = await fetch('http://localhost:10030/api/v1/venue-category', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  console.log('POST status:', res.status);
  console.log('POST response:', JSON.stringify(json, null, 2));

  const id = json?.data?.id || json?.id;
  if (!id) return;

  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('event_booking');

  const inCategories = await db.collection('categories').findOne({ _id: new ObjectId(id) });
  const inLegacy = await db.collection('venue_categories').findOne({ _id: new ObjectId(id) });

  console.log('\nIn categories collection:', !!inCategories, inCategories?.name);
  console.log('In venue_categories collection:', !!inLegacy, inLegacy?.name);
  await client.close();
}

testPost().catch(console.error);
