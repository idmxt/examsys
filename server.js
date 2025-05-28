const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Отдаём всё из папки public как статические файлы
app.use(express.static(path.join(__dirname, "public")));

// На всякий случай — возвращаем index.html на все остальные запросы (для SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
