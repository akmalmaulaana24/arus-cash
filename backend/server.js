const express = require("express"),
  cors = require("cors"),
  path = require("path");
require("./db");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/categories", require("./routes/category"));
app.use("/api/transactions", require("./routes/transaction"));
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/index.html")),
);
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Arus Cash berjalan di http://localhost:${port}`),
);
