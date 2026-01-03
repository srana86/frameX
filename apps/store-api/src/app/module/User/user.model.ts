/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import { TUser, UserModel } from "./user.interface";
import config from "../../../config";

// Todo. Change the code as par your project need. Below mongoose schema, pre and post hook and static method code is shown for your reference.

//You can read my following blog to get deeper understanding about creating different types of schema and model https://dev.to/md_enayeturrahman_2560e3/how-to-create-api-in-an-industry-standard-app-44ck

const userSchema = new Schema<TUser, UserModel>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
    },
    phone: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      select: 0,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
      select: 0,
    },
    role: {
      type: String,
      enum: ["customer", "merchant", "admin"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["in-progress", "blocked"],
      default: "in-progress",
    },
    needsPasswordChange: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    resetToken: {
      type: String,
      select: 0,
    },
    resetTokenExpiry: {
      type: Date,
      select: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this; // doc

  // only hash the password if it has been modified (or is new) AND exists
  if (!user.isModified("password") || !user.password) return next();

  // hashing password and save into DB
  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds)
  );

  // set passwordChangedAt timestamp
  user.passwordChangedAt = new Date();

  next();
});

// set '' after saving password
userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});

userSchema.statics.isUserExistsByCustomId = async function (id: string) {
  return await User.findOne({ id, isDeleted: false }).select(
    "+password +resetToken +resetTokenExpiry"
  );
};

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  return await User.findOne({ email, isDeleted: false }).select("+password");
};

userSchema.statics.isUserExistsByPhone = async function (phone: string) {
  return await User.findOne({ phone, isDeleted: false }).select("+password");
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

export const User = model<TUser, UserModel>("User", userSchema);
