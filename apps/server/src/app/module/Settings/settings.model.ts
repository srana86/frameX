import { Schema, model } from "mongoose";
import { ISettings } from "./settings.interface";

const settingsSchema = new Schema<ISettings>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: false,
    strict: false, // Allow dynamic fields
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Note: id field has unique: true, which automatically creates an index

export const Settings = model<ISettings>("settings", settingsSchema);
