import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "filmpass.db");

export function getDb() {
  sqlite3.verbose();
  const db = new sqlite3.Database(dbPath);
  return db;
}

function runSqlFile(db, file) {
  const sql = fs.readFileSync(path.join(__dirname, file), "utf-8");
  return new Promise((resolve, reject) => {
    db.exec(sql, err => (err ? reject(err) : resolve()));
  });
}

async function reset() {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  const db = getDb();
  try {
    await runSqlFile(db, "schema.sql");
    await runSqlFile(db, "seed.sql");
    console.log("Database reset complete.");
  } catch (e) {
    console.error("DB reset failed:", e);
    process.exit(1);
  } finally {
    db.close();
  }
}

if (process.argv.includes("--reset")) {
  reset();
}
