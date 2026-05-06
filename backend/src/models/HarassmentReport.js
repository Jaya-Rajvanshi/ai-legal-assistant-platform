import mongoose from "mongoose";

const harassmentReportSchema = new mongoose.Schema(
  {
    isAnonymous: { type: Boolean, default: false },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
    email: { type: String },
    description: { type: String, required: true },
    category: { type: String }, // Auto-categorized via OpenAI
    translatedText: { type: String }, // Hindi/English combined or translated version
    emailTemplateText: { type: String }, // Auto-generated formatted email
    evidenceUrl: { type: String },
    evidenceType: { type: String },
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
    trackingId: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["pending", "in_review", "resolved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const HarassmentReport = mongoose.model(
  "HarassmentReport",
  harassmentReportSchema
);

export default HarassmentReport;

