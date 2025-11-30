// fix-database.cjs
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function fixDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connected to database\n');
    
    // Check what tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Current tables:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');
    
    // Check old movie table
    const oldMovies = await client.query(`
      SELECT COUNT(*) FROM movie
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    // Check new movies table
    const newMovies = await client.query(`
      SELECT COUNT(*) FROM movies
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    console.log(`Old 'movie' table: ${oldMovies.rows[0].count} rows`);
    console.log(`New 'movies' table: ${newMovies.rows[0].count} rows\n`);
    
    // Drop old tables and recreate everything
    console.log('🗑️  Dropping old tables...');
    await client.query(`
      DROP TABLE IF EXISTS booking CASCADE;
      DROP TABLE IF EXISTS showtime CASCADE;
      DROP TABLE IF EXISTS theater CASCADE;
      DROP TABLE IF EXISTS movie CASCADE;
    `);
    console.log('✅ Old tables dropped\n');
    
    // Now reseed with the new schema
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema-postgres.sql'),
      'utf8'
    );
    
    console.log('📋 Creating new schema...');
    await client.query(schemaSQL);
    console.log('✅ Schema created\n');
    
    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed-postgres.sql'),
      'utf8'
    );
    
    console.log('🌱 Seeding database...');
    await client.query(seedSQL);
    
    // Verify
    const finalCount = await client.query('SELECT COUNT(*) FROM movies');
    console.log(`✅ Database fixed! Movies in database: ${finalCount.rows[0].count}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDatabase();
