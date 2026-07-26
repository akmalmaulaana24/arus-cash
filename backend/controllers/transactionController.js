const db = require("../db");

exports.getAll = (req, res) => {
  const { type } = req.query;
  let query = `
    SELECT t.*, c.name AS category, c.icon
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
  `;
  const params = [];

  if (type) {
    query += " WHERE t.type = ?";
    params.push(type);
  }

  query += " ORDER BY t.date DESC, t.id DESC";

  db.all(query, params, (error, transactions) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(transactions);
  });
};

exports.create = (req, res) => {
  const { title, amount, type, category_id, date } = req.body;

  if (
    !title ||
    !Number(amount) ||
    !["income", "expense"].includes(type) ||
    !date
  ) {
    return res.status(400).json({ error: "Data transaksi tidak valid." });
  }

  const query = `
    INSERT INTO transactions (title, amount, type, category_id, date)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [title, amount, type, category_id || null, date],
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(201).json({ id: this.lastID, ...req.body });
    },
  );
};

exports.remove = (req, res) => {
  db.run(
    "DELETE FROM transactions WHERE id = ?",
    [req.params.id],
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ deleted: this.changes });
    },
  );
};

exports.getSummary = (req, res) => {
  db.all(
    "SELECT type, COALESCE(SUM(amount), 0) AS total FROM transactions GROUP BY type",
    (error, totals) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const categoryQuery = `
        SELECT c.name, c.icon, SUM(t.amount) AS total
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE t.type = 'expense'
        GROUP BY t.category_id
        ORDER BY total DESC
        LIMIT 5
      `;

      db.all(categoryQuery, (categoryError, categories) => {
        if (categoryError) {
          return res.status(500).json({ error: categoryError.message });
        }

        res.json({ totals, categories });
      });
    },
  );
};
