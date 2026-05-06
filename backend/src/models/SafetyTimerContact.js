import mongoose from "mongoose";

const safetyTimerContactSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, required: true },
    userName: { type: String, trim: true },
    contacts: [
      {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
      },
    ],
  },
  { timestamps: true }
);

const SafetyTimerContact = mongoose.model(
  "SafetyTimerContact",
  safetyTimerContactSchema
);

export default SafetyTimerContact;
