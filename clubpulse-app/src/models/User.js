import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, select: false },
    firebaseUid: { type: String, index: true, sparse: true },
    authProvider: { type: String, enum: ["password", "google", "firebase"], default: "password" },
    role: { type: String, enum: ["student", "leader", "admin"], default: "student" },
    avatar: { type: String, default: "" },
    department: { type: String, required: true },
    year: { type: String, required: true },
    bio: { type: String },
    clubsJoined: [{ type: String }],
}, { timestamps: true });
export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default UserModel;
