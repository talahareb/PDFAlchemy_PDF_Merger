const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("PDF routes");
});

module.exports = router;
