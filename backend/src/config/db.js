import mongoose from "mongoose";

// Flag to indicate whether we are using in-memory storage instead of MongoDB.
export let useInMemoryDb = false;

// Simple in-memory store to keep data when MongoDB is not available.
export const memoryStore = {
  users: [],
  harassmentReports: [],
  missingAlerts: [],
  missingPersonReports: [],
  legalInteractions: [],
  safetyTimerContacts: [],
  safetyTimerSessions: [],
  safetyTimerAlertLogs: [],
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    // No Mongo connection string → run in in-memory mode.
    useInMemoryDb = true;
    console.warn(
      "MONGO_URI is not set. Running in in-memory mode. Data will NOT be persisted."
    );
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || "ai_legal_emergency_support",
    });
    console.log("MongoDB connected");
    useInMemoryDb = false;
  } catch (error) {
    console.error(
      "MongoDB connection error. Falling back to in-memory storage:",
      error.message
    );
    useInMemoryDb = true;
  }
};

export default connectDB;


