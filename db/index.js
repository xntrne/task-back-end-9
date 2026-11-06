import dns from "node:dns";
import mongoose from "mongoose";

dns.setDefaultResultOrder("ipv4first");

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/movie-app";

  mongoose.connection.on("connected", () => {
    console.log("mongodb connected");
  });

  mongoose.connection.on("error", (error) => {
    console.log("mongodb error", error.message);
  });

  await mongoose.connect(uri);
}
