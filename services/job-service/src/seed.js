import mongoose from 'mongoose';
import { config, required } from '@smartjob/shared/config';
import { settings } from './config/index.js';
import { Job } from './models/Job.js';
import { objectId } from '@smartjob/shared/validation';

const examples = [
  [
    'Frontend Developer (React)',
    'NovaTech',
    'Hà Nội',
    18000000,
    30000000,
    ['react', 'javascript', 'git'],
    2,
    'FULL_TIME',
  ],
  [
    'Backend Developer (Node.js)',
    'CloudNest',
    'TP. Hồ Chí Minh',
    22000000,
    38000000,
    ['node.js', 'mongodb', 'rest api'],
    2,
    'FULL_TIME',
  ],
  [
    'Fullstack Developer',
    'NovaTech',
    'Hà Nội',
    20000000,
    35000000,
    ['react', 'node.js', 'mongodb'],
    2,
    'FULL_TIME',
  ],
  [
    'UI/UX Designer',
    'Mộc Studio',
    'Đà Nẵng',
    15000000,
    25000000,
    ['figma', 'ui design', 'ux research'],
    1,
    'FULL_TIME',
  ],
  [
    'Thực tập sinh Frontend',
    'BlueOrbit',
    'Hà Nội',
    4000000,
    7000000,
    ['javascript', 'html', 'css'],
    0,
    'INTERNSHIP',
  ],
  [
    'React Developer — Remote',
    'RemoteCraft',
    'Remote',
    25000000,
    45000000,
    ['react', 'javascript', 'english'],
    3,
    'CONTRACT',
  ],
  [
    'QA Engineer',
    'CloudNest',
    'TP. Hồ Chí Minh',
    14000000,
    23000000,
    ['testing', 'postman', 'sql'],
    1,
    'FULL_TIME',
  ],
  [
    'Data Analyst',
    'InsightWorks',
    'Hà Nội',
    18000000,
    28000000,
    ['sql', 'python', 'power bi'],
    1,
    'FULL_TIME',
  ],
  [
    'Java Backend Developer',
    'FinBridge',
    'Đà Nẵng',
    20000000,
    35000000,
    ['java', 'spring boot', 'sql'],
    2,
    'FULL_TIME',
  ],
];
try {
  const recruiterId = objectId.parse(required('SEED_RECRUITER_ID'));
  await mongoose.connect(config().mongoUri, {
    dbName: settings().database,
    serverSelectionTimeoutMS: 5000,
  });
  await Job.init();
  let created = 0;
  for (const [
    title,
    companyName,
    location,
    salaryMin,
    salaryMax,
    requiredSkills,
    experienceMin,
    jobType,
  ] of examples) {
    if (await Job.exists({ title, recruiterId })) continue;
    await Job.create({
      title,
      companyName,
      location,
      salaryMin,
      salaryMax,
      requiredSkills,
      experienceMin,
      jobType,
      recruiterId,
      status: 'open',
      description: `VỀ VỊ TRÍ\n${companyName} tìm kiếm ${title} để cùng xây dựng các sản phẩm chất lượng và có tác động thực tế.\n\nCÔNG VIỆC CỦA BẠN\n• Tham gia phân tích yêu cầu, phát triển và cải tiến sản phẩm.\n• Phối hợp với đồng đội, trao đổi giải pháp và đánh giá chất lượng công việc.\n• Chủ động học hỏi, chia sẻ kiến thức và tối ưu quy trình.\n\nYÊU CẦU\n• Có kiến thức về ${requiredSkills.join(', ')}.\n• ${experienceMin === 0 ? 'Chào đón ứng viên mới bắt đầu và có tinh thần học hỏi.' : `Có từ ${experienceMin} năm kinh nghiệm liên quan.`}\n• Giao tiếp rõ ràng, trách nhiệm và làm việc nhóm tốt.\n\nQUYỀN LỢI\n• Mức lương minh bạch, đánh giá theo năng lực.\n• Môi trường cởi mở, có người hướng dẫn và chia sẻ kiến thức.\n• Cơ hội phát triển chuyên môn và tham gia dự án thực tế.\n\nĐây là tin mẫu được tạo bằng seed script để phục vụ demo đồ án.`,
    });
    created += 1;
  }
  console.log(JSON.stringify({ created, existing: examples.length - created }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
