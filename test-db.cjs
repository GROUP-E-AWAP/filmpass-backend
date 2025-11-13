// test-db.cjs
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // required by Azure
});

pool
  .connect()
  .then(client => {
    console.log('✅ Connected successfully to Azure PostgreSQL!');
    return client.query('SELECT NOW();')
      .then(res => {
        console.log('🕒 Server time:', res.rows[0]);
        client.release();
        pool.end();
      });
  })
  .catch(err => {
    console.error('❌ Connection failed:');
    console.error(err.message);
  });