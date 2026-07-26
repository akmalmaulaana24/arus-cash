const sqlite3 = require("sqlite3").verbose(),
  path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "keuangan.db"));
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT CHECK(type IN ('income','expense')) NOT NULL,icon TEXT DEFAULT '🏷️')`,
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,amount REAL NOT NULL,type TEXT CHECK(type IN ('income','expense')) NOT NULL,category_id INTEGER,date TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL)`,
  );
  db.get("SELECT COUNT(*) c FROM categories", (e, r) => {
    if (!r.c) {
      const s = db.prepare(
        "INSERT INTO categories(name,type,icon) VALUES(?,?,?)",
      );
      [
        ["Gaji", "income", "💼"],
        ["Freelance", "income", "💻"],
        ["Makanan", "expense", "🍜"],
        ["Transportasi", "expense", "🚗"],
        ["Belanja", "expense", "🛍️"],
        ["Tagihan", "expense", "📄"],
      ].forEach((x) => s.run(x));
      s.finalize();
    }
  });
});
module.exports = db;
