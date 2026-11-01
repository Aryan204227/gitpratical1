import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectMongoose } from "@/lib/db";

let mongoServer;
let previousMongoUri;

function resetConnectionCache() {
  if (globalThis._mongooseConnection) {
    globalThis._mongooseConnection.conn = null;
    globalThis._mongooseConnection.promise = null;
  }
}

export async function startTestDatabase() {
  previousMongoUri = process.env.MONGODB_URI;
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri("clubpulse_test");
  resetConnectionCache();
  await connectMongoose();
}

export async function clearTestDatabase() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDatabase() {
  await mongoose.disconnect();
  resetConnectionCache();
}

export async function reconnectTestDatabase() {
  if (!mongoServer) throw new Error("The test MongoDB server has not been started.");
  await mongoose.disconnect();
  process.env.MONGODB_URI = mongoServer.getUri("clubpulse_test");
  resetConnectionCache();
  await connectMongoose();
}

export async function stopTestDatabase() {
  await disconnectTestDatabase();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
  if (previousMongoUri === undefined) delete process.env.MONGODB_URI;
  else process.env.MONGODB_URI = previousMongoUri;
}
