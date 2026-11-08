import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    companyName: { type: String, required: true },
    recruiterId: { type: String, required: true, index: true },
    location: { type: String, required: true },
    salaryMin: { type: Number, required: true, min: 0 },
    salaryMax: { type: Number, required: true, min: 0 },
    requiredSkills: { type: [String], default: [] },
    experienceMin: { type: Number, default: 0, min: 0 },
    jobType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'],
      default: 'FULL_TIME',
    },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true },
);
schema.index({ status: 1, createdAt: -1 });
export const Job = mongoose.model('Job', schema);
