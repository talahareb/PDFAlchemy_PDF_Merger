const mongoose = require("mongoose");
require("dotenv").config(); // Ensure dotenv is loaded before using process.env

const connectDB = async () => {
  try {
    const uri = process.env.MongoDB_URI;
    if (!uri) {
      throw new Error("MongoDB_URI is not defined in .env file");
    }
    await mongoose.connect(uri);
    console.log("MongoDB connected !");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
