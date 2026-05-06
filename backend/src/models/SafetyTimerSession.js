import mongoose from "mongoose";

const safetyTimerSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, required: true },
    userName: { type: String, trim: true },
    durationMinutes: { type: Number, required: true },
    status: {
      type: String,
      enum: ["running", "safe", "expired", "error"],
      default: "running",
    },
    contacts: [
      {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
      },
    ],
    location: {
      lat: Number,
      lng: Number,
      mapsUrl: String,
    },
    alertMessage: String,
    alertResults: [
      {
        name: String,
        phone: String,
        status: String,
        sid: String,
        error: String,
        smsLink: String,
        whatsappLink: String,
        callLink: String,
      },
    ],
    startedAt: Date,
    stoppedAt: Date,
    expiredAt: Date,
    triggeredAt: Date,
  },
  { timestamps: true }
);

const SafetyTimerSession = mongoose.model(
  "SafetyTimerSession",
  safetyTimerSessionSchema
);

export default SafetyTimerSession;
