import mongoose from "mongoose";

const legalInteractionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    firDraft: { type: String },
    suggestedSections: [{ type: String }],
  },
  { timestamps: true }
);

const LegalInteraction = mongoose.model(
  "LegalInteraction",
  legalInteractionSchema
);

export default LegalInteraction;

