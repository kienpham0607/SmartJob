import mongoose from 'mongoose';
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['CANDIDATE', 'RECRUITER'], required: true },
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
    desiredPosition: { type: String, default: '' },
    location: { type: String, default: '' },
    companyName: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, result) {
        delete result.passwordHash;
        delete result.__v;
        return result;
      },
    },
  },
);
export const User = mongoose.model('User', userSchema);
