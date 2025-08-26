require("dotenv").config();
const admin = require("firebase-admin");

// Initialize Firebase Admin
let db;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  }

  db = admin.firestore();
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error);
  throw error;
}

// Collection references
const collections = {
  tasks: db.collection("tasks"),
  validations: db.collection("validations"),
  shares: db.collection("shares"),
};

// Helper functions for common operations
const firebaseHelpers = {
  // Convert Firestore timestamp to ISO string
  timestampToISO: (timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    return timestamp;
  },

  // Convert ISO string to Firestore timestamp
  isoToTimestamp: (isoString) => {
    if (isoString) {
      return admin.firestore.Timestamp.fromDate(new Date(isoString));
    }
    return null;
  },

  // Add created/updated timestamps
  addTimestamps: (data, isUpdate = false) => {
    const now = admin.firestore.Timestamp.now();
    if (isUpdate) {
      return { ...data, updatedAt: now };
    }
    return { ...data, createdAt: now, updatedAt: now };
  },

  // Generate a unique ID
  generateId: () => {
    return db.collection("_temp").doc().id;
  },
};

module.exports = {
  admin,
  db,
  collections,
  firebaseHelpers,
};
