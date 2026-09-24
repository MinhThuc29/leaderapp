import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env['LEADER_EMAIL'] ?? 'admin@leaderos.local';
  const defaultPassword = process.env['LEADER_PASSWORD'] ?? 'LeaderOS@2026!';
  const name = process.env['LEADER_NAME'] ?? 'Engineering Leader';

  console.log(`Đang khởi tạo tài khoản Leader mặc định: ${email}...`);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const leader = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash: passwordHash,
      name,
    },
    create: {
      email,
      password_hash: passwordHash,
      name,
    },
  });

  console.log('✅ Seed tài khoản Leader thành công:');
  console.log(`- ID: ${leader.id}`);
  console.log(`- Email: ${leader.email}`);
  console.log(`- Tên: ${leader.name}`);
  console.log(`- Mật khẩu mặc định: ${defaultPassword}`);
}

main()
  .catch((e: unknown) => {
    console.error('❌ Lỗi khi seed tài khoản Leader:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
