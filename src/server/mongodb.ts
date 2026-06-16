import mongoose from "mongoose";
import { env } from "~/env";

const globalForMongo = globalThis as unknown as {
  mongoose: typeof mongoose | undefined;
};

export const connectMongo = async () => {
  if (globalForMongo.mongoose) {
    return globalForMongo.mongoose;
  }

  try {
    const connection = await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");
    globalForMongo.mongoose = connection;
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export const getMongoConnection = () => {
  return mongoose.connection;
};
