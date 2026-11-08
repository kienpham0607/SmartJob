import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { ApiError } from '@smartjob/shared/errors';
import { signToken } from '@smartjob/shared/auth';

export async function register(input) {
  if (await User.exists({ email: input.email }))
    throw new ApiError(409, 'Email đã được sử dụng.', 'EMAIL_EXISTS');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash,
  });
  return { user: user.toJSON(), token: signToken(user) };
}
export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng.', 'INVALID_CREDENTIALS');
  return { user: user.toJSON(), token: signToken(user) };
}
export async function findUser(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
  return user;
}
export async function updateProfile(id, input) {
  const user = await findUser(id);
  // Role, email and password cannot be reassigned through a profile update.
  const allowed =
    user.role === 'CANDIDATE'
      ? ['name', 'skills', 'experienceYears', 'desiredPosition', 'location', 'phone', 'bio']
      : ['name', 'companyName', 'location', 'phone', 'bio'];
  for (const key of allowed) if (input[key] !== undefined) user[key] = input[key];
  await user.save();
  return user;
}
