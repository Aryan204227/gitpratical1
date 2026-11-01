import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Read MONGODB_URI from .env.local
const envPath = path.join(process.cwd(), ".env.local");
let uri = process.env.MONGODB_URI;

if (!uri && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      uri = trimmed.replace("MONGODB_URI=", "").trim();
      break;
    }
  }
}

if (!uri) {
  console.error("❌ No MONGODB_URI found in .env.local");
  process.exit(1);
}

// Mask password for display
const maskedUri = uri.replace(/:([^:@]+)@/, ":*****@");
console.log(`\n🔍 Connecting to MongoDB: ${maskedUri} ...`);

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("✅ SUCCESS: Successfully connected to MongoDB Atlas!");
  console.log(`📡 Database name: ${mongoose.connection.name}`);
  console.log(`🟢 ReadyState: ${mongoose.connection.readyState} (Connected)\n`);
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error("\n❌ Connection Failed!");
  console.error(`Error details: ${error.message}\n`);

  if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
    console.log("💡 How to fix 'bad auth':");
    console.log(" 1. Go to cloud.mongodb.com -> Database Access.");
    console.log(" 2. Find the user 'ayush' (or click 'Edit' / 'Add New Database User').");
    console.log(" 3. Click 'Edit' -> 'Edit Password' and set a known password.");
    console.log(" 4. Update the password in .env.local without angle brackets: MONGODB_URI=mongodb://ayush:YOUR_NEW_PASSWORD@...\n");
  } else if (error.message.includes("IP") || error.message.includes("whitelist") || error.message.includes("timeout")) {
    console.log("💡 How to fix network timeout:");
    console.log(" 1. Go to cloud.mongodb.com -> Network Access.");
    console.log(" 2. Add IP Address -> 'Allow Access from Anywhere' (0.0.0.0/0).\n");
  }
  process.exit(1);
}
