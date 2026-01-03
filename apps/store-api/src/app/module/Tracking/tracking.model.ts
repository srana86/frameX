import { Schema, model } from "mongoose";
import { FBEvent } from "./tracking.interface";

const fbEventSchema = new Schema<FBEvent>(
  {
    id: {
      type: String,
      unique: true,
      sparse: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      unique: true,
      sparse: true,
    },
    eventData: {
      type: Schema.Types.Mixed,
    },
    userData: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying by event name and date
fbEventSchema.index({ eventName: 1, timestamp: -1 });

export const FBEventModel = model<FBEvent>("FBEvent", fbEventSchema);
