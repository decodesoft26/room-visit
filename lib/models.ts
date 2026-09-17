import { Schema, model, models } from "mongoose"
const base = { timestamps: true }
export const HotelProfile =
  models.HotelProfile ||
  model(
    "HotelProfile",
    new Schema(
      {
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
      },
      base
    )
  )
export const User =
  models.User ||
  model(
    "User",
    new Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ["SUPER_ADMIN", "USER"], default: "USER" },
        hotelId: {
          type: Schema.Types.ObjectId,
          ref: "HotelProfile",
          default: null,
        },
      },
      base
    )
  )
export const Room =
  models.Room ||
  model(
    "Room",
    new Schema(
      {
        roomNo: { type: String, required: true, trim: true },
        roomType: { type: String, required: true },
        roomFloor: { type: String, required: true },
        hotelId: {
          type: Schema.Types.ObjectId,
          ref: "HotelProfile",
          required: true,
        },
        lastVisitAt: Date,
      },
      base
    ).index({ hotelId: 1, roomNo: 1 }, { unique: true })
  )
export const Visit =
  models.Visit ||
  model(
    "Visit",
    new Schema(
      {
        roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
        hotelId: {
          type: Schema.Types.ObjectId,
          ref: "HotelProfile",
          required: true,
        },
        visitBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        status: {
          type: String,
          enum: ["OK", "ATTENTION", "URGENT"],
          default: "OK",
        },
        remarks: { type: String, default: "" },
        photos: [{ url: String, publicId: String }],
      },
      base
    ).index({ roomId: 1, createdAt: -1 })
  )
