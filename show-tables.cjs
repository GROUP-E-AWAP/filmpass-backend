// show-tables.cjs
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function showTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connected to Azure PostgreSQL\n');
    
    // Get all tables
    const tables = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:\n');
    
    for (const table of tables.rows) {
      console.log(`📦 ${table.table_name} (${table.column_count} columns)`);
      
      // Get row count
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`   Rows: ${count.rows[0].count}`);
      
      // Get column details
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      console.log('   Columns:');
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

showTables();