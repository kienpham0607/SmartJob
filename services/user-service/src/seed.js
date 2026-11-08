import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config, required } from '@smartjob/shared/config';
import { settings } from './config/index.js';
import { User } from './models/User.js';

try {
  await mongoose.connect(config().mongoUri, {
    dbName: settings().database,
    serverSelectionTimeoutMS: 5000,
  });
  await User.init();
  const password = required('DEMO_PASSWORD', 8);
  if (Buffer.byteLength(password, 'utf8') > 72)
    throw new Error('DEMO_PASSWORD phải tối đa 72 byte.');
  const accounts = [
    {
      email: required('DEMO_CANDIDATE_EMAIL').toLowerCase(),
      role: 'CANDIDATE',
      name: 'Nguyễn Minh Anh',
      skills: ['react', 'javascript', 'node.js', 'mongodb', 'git'],
      experienceYears: 2,
      desiredPosition: 'Frontend Developer',
      location: 'Hà Nội',
      bio: 'Lập trình viên yêu thích xây dựng trải nghiệm web dễ sử dụng. Mong muốn tham gia đội ngũ sản phẩm với React và Node.js.',
    },
    {
      email: required('DEMO_RECRUITER_EMAIL').toLowerCase(),
      role: 'RECRUITER',
      name: 'Trần Hoàng Nam',
      companyName: 'NovaTech',
      location: 'Hà Nội',
      bio: 'Đội ngũ công nghệ phát triển sản phẩm số cho doanh nghiệp Việt Nam.',
    },
  ];
  const result = {};
  for (const input of accounts) {
    let user = await User.findOne({ email: input.email });
    if (user && user.role !== input.role)
      throw new Error(
        `Tài khoản ${input.email} đã tồn tại với vai trò khác. Chọn email demo mới trong .env.`,
      );
    const created = !user;
    if (!user)
      user = await User.create({ ...input, passwordHash: await bcrypt.hash(password, 12) });
    result[input.role] = { id: String(user._id), email: user.email, created };
  }
  // Only this sanitized JSON is consumed by the root seed orchestrator.
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
