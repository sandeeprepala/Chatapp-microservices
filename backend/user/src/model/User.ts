import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  loginType: 'otp' | 'password';
}

const schema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return this.loginType === 'password';
      }
    },
    loginType: {
      type: String,
      enum: ['otp', 'password'],
      default: 'otp'
    }
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", schema);
