const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());
// Health check — open http://localhost:5001/api/health to confirm it's working
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
