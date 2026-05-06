import mongoose from "mongoose";

const missingPersonSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String },
    lastSeenLocation: { type: String, required: true },
    dateLastSeen: { type: Date, required: true },
    description: { type: String, required: true },
    photo: { type: String },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const MissingPerson = mongoose.model("MissingPerson", missingPersonSchema);

export default MissingPerson;
