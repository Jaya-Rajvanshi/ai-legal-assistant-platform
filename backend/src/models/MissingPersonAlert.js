import mongoose from "mongoose";

const missingPersonAlertSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    lastSeenLocation: { type: String },
    lastSeenDate: { type: Date },
    contactNumber: { type: String, required: true },
    additionalDetails: { type: String },
    rewrittenDescription: { type: String }, // AI rewritten description
    posterText: { type: String }, // AI-generated poster layout text
    photoUrl: { type: String },
    region: { type: String, index: true },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    publicId: { type: String, unique: true, required: true }, // Public slug/id for shareable link
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const MissingPersonAlert = mongoose.model(
  "MissingPersonAlert",
  missingPersonAlertSchema
);

export default MissingPersonAlert;

