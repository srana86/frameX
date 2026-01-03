import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { getCollection } from "./mongodb";
import { ObjectId, type Document } from "mongodb";

interface UserDocument extends Document {
  _id: ObjectId;
  fullName: string;
  email?: string;
  phone?: string;
  password?: string;
  googleId?: string;
  role?: "customer" | "merchant" | "admin";
  merchantId?: string; // Links to merchant deployment/subscription
  createdAt: string;
  updatedAt?: string;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: "customer" | "merchant" | "admin";
  merchantId?: string; // Links to merchant deployment/subscription
  createdAt: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    const col = await getCollection<UserDocument>("users");
    let user: UserDocument | null = null;

    try {
      // Try to convert userId to ObjectId
      const userId = new ObjectId(payload.userId);
      user = await col.findOne({ _id: userId });
    } catch (error) {
      // If ObjectId conversion fails, the userId is invalid
      return null;
    }

    if (!user) {
      return null;
    }

    return {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: (user.role || "customer") as "customer" | "merchant" | "admin",
      merchantId: user.merchantId,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
