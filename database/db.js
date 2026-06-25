const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, '..', 'poulet_factory.db'));

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    discordId TEXT PRIMARY KEY,
    balance REAL DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    description TEXT DEFAULT ''
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordId TEXT NOT NULL,
    productName TEXT NOT NULL,
    price REAL NOT NULL,
    buyerName TEXT NOT NULL,
    buyerFirstName TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    accountInfo TEXT DEFAULT NULL,
    channelId TEXT DEFAULT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

try { db.exec("ALTER TABLE orders ADD COLUMN completedAt TEXT DEFAULT NULL"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN paymentMethod TEXT DEFAULT NULL"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN paymentInfo TEXT DEFAULT NULL"); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS giveaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelId TEXT NOT NULL,
    messageId TEXT DEFAULT NULL,
    hosterId TEXT NOT NULL,
    prize TEXT NOT NULL,
    duration INTEGER NOT NULL,
    winnersCount INTEGER NOT NULL DEFAULT 1,
    participants TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    endedAt TEXT DEFAULT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordId TEXT NOT NULL,
    productId INTEGER NOT NULL,
    productName TEXT NOT NULL,
    price REAL NOT NULL,
    addedAt TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordId TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    method TEXT DEFAULT NULL,
    status TEXT DEFAULT 'pending',
    channelId TEXT DEFAULT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

try { db.exec('ALTER TABLE transactions ADD COLUMN channelId TEXT DEFAULT NULL'); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordId TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    verifiedAt TEXT DEFAULT (datetime('now')),
    blockedAt TEXT DEFAULT NULL,
    UNIQUE(discordId)
  )
`);
const seedProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (seedProducts.count === 0) {
  const insert = db.prepare('INSERT INTO products (name, price, stock, description) VALUES (?, ?, ?, ?)');
  insert.run('🍗 800 PTS', 3.00, 999, 'Pack 800 points');
  insert.run('🎟️ 1000 PTS', 3.75, 999, 'Pack 1000 points');
  insert.run('🎁 1300 PTS', 4.00, 999, 'Pack 1300 points');
  insert.run('⚡ 1600 PTS', 5.00, 999, 'Pack 1600 points');
  insert.run('🔥 1800 PTS', 6.50, 999, 'Pack 1800 points');
  insert.run('👑 2000 PTS', 7.50, 999, 'Pack 2000 points');
}

module.exports = db;
