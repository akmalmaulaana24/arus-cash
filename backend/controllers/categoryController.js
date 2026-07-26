const db = require("../db");

exports.getAll = (req, res) => {
  const query = "SELECT * FROM categories ORDER BY type, name";

  db.all(query, (error, categories) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(categories);
  });
};

exports.create = (req, res) => {
  const { name, type, icon = "🏷️" } = req.body;

  if (!name || !["income", "expense"].includes(type)) {
    return res.status(400).json({ error: "Data kategori tidak valid." });
  }

  const query = "INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)";
  db.run(query, [name, type, icon], function (error) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ id: this.lastID, name, type, icon });
  });
};

exports.remove = (req, res) => {
  db.run(
    "DELETE FROM categories WHERE id = ?",
    [req.params.id],
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ deleted: this.changes });
    },
  );
};
