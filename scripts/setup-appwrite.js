const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.development' });

async function setupAppwrite() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = 'debatehub_main';

  console.log('🚀 Starting Appwrite Database Setup...');

  try {
    console.log('1. Creating Database: debatehub_main');
    try {
      await databases.create(dbId, 'DebateHub Database');
      console.log('✅ Database created.');
    } catch (e) {
      if (e.code === 409) {
        console.log('ℹ️ Database already exists.');
      } else {
        throw e;
      }
    }

    // 1. Profiles Collection
    console.log('2. Creating Profiles Collection...');
    try {
      await databases.createCollection(dbId, 'profiles', 'Profiles');
      await databases.createStringAttribute(dbId, 'profiles', 'username', 255, true);
      await databases.createStringAttribute(dbId, 'profiles', 'display_name', 255, true);
      await databases.createStringAttribute(dbId, 'profiles', 'avatar_url', 1000, false);
      await databases.createIntegerAttribute(dbId, 'profiles', 'points', false, 0, 1000000, 0);
      await databases.createIntegerAttribute(dbId, 'profiles', 'level', false, 1, 100, 1);
      console.log('✅ Profiles Collection created.');
    } catch (e) { if (e.code !== 409) console.error(e.message); else console.log('ℹ️ Profiles exists.'); }

    // 2. Categories Collection
    console.log('3. Creating Categories Collection...');
    try {
      await databases.createCollection(dbId, 'categories', 'Categories');
      await databases.createStringAttribute(dbId, 'categories', 'name', 255, true);
      await databases.createStringAttribute(dbId, 'categories', 'slug', 255, true);
      await databases.createStringAttribute(dbId, 'categories', 'color', 255, true);
      console.log('✅ Categories Collection created.');
    } catch (e) { if (e.code !== 409) console.error(e.message); else console.log('ℹ️ Categories exists.'); }

    // 3. Debates Collection
    console.log('4. Creating Debates Collection...');
    try {
      await databases.createCollection(dbId, 'debates', 'Debates');
      await databases.createStringAttribute(dbId, 'debates', 'title', 500, true);
      await databases.createStringAttribute(dbId, 'debates', 'description', 5000, false);
      await databases.createStringAttribute(dbId, 'debates', 'category_id', 255, false);
      await databases.createStringAttribute(dbId, 'debates', 'author_id', 255, true);
      await databases.createStringAttribute(dbId, 'debates', 'status', 255, false, 'active');
      await databases.createIntegerAttribute(dbId, 'debates', 'agree_count', false, 0, 1000000, 0);
      await databases.createIntegerAttribute(dbId, 'debates', 'disagree_count', false, 0, 1000000, 0);
      await databases.createIntegerAttribute(dbId, 'debates', 'view_count', false, 0, 1000000, 0);
      await databases.createBooleanAttribute(dbId, 'debates', 'is_anonymous', false, false);
      console.log('✅ Debates Collection created.');
    } catch (e) { if (e.code !== 409) console.error(e.message); else console.log('ℹ️ Debates exists.'); }

    // 4. Comments Collection
    console.log('5. Creating Comments Collection...');
    try {
      await databases.createCollection(dbId, 'comments', 'Comments');
      await databases.createStringAttribute(dbId, 'comments', 'debate_id', 255, true);
      await databases.createStringAttribute(dbId, 'comments', 'author_id', 255, true);
      await databases.createStringAttribute(dbId, 'comments', 'content', 5000, true);
      await databases.createStringAttribute(dbId, 'comments', 'stance', 255, true);
      await databases.createIntegerAttribute(dbId, 'comments', 'upvotes', false, 0, 1000000, 0);
      console.log('✅ Comments Collection created.');
    } catch (e) { if (e.code !== 409) console.error(e.message); else console.log('ℹ️ Comments exists.'); }

    console.log('🎉 Setup Complete! Add NEXT_PUBLIC_APPWRITE_DATABASE_ID="debatehub_main" to your env variables.');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupAppwrite();
