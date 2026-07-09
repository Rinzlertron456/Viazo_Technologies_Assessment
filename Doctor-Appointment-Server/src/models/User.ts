import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole =
  | "Patient"
  | "Doctor"
  | "Receptionist"
  | "Admin"
  | "SuperAdmin";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  customId?: string;
  isActive: boolean;
  isVerified: boolean;
  profilePicture?: string;
  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  verificationToken?: string;
  verificationExpires?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["Patient", "Doctor", "Receptionist", "Admin", "SuperAdmin"],
      required: [true, "Role is required"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    customId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationExpires: {
      type: Date,
      select: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Auto-assign a privacy-friendly public ID (e.g. PT-AB12CD) instead of the
// MongoDB _id. Never changes once set.
userSchema.pre("save", async function () {
  if (this.customId) return;
  const prefix =
    { Patient: "PT", Doctor: "DR", Receptionist: "RC", Admin: "AD", SuperAdmin: "SA" }[
      this.role
    ] || "US";
  const suffix = (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  )
    .toUpperCase()
    .slice(-6)
    .padStart(6, "0");
  this.customId = `${prefix}-${suffix}`;
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
