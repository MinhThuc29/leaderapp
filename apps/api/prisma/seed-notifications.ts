import { PrismaClient, Priority, TaskStatus, MeetingStatus, RiskStatus, DecisionStatus, FollowUpStatus, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu seed dữ liệu SQL thực tế cho tính năng Thông báo & Cuộc họp...');

  // 1. Tìm hoặc lấy user chính
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('Chưa có user nào trong database!');
  }
  console.log(`👤 Leader user: ${user.name} (${user.email}) - ID: ${user.id}`);

  // 2. Tìm hoặc tạo Member (Đặng Tuấn Kiệt - Senior Backend Engineer)
  let member = await prisma.member.findFirst({
    where: { name: 'Đặng Tuấn Kiệt' },
  });
  if (!member) {
    member = await prisma.member.create({
      data: {
        name: 'Đặng Tuấn Kiệt',
        nickname: 'KietDT',
        role: 'Senior Backend Engineer',
        level: 'Senior III',
        email: 'kiet.dt@leaderos.local',
        phone: '0901234567',
        active: true,
        notes: 'Chuyên trách kiến trúc Microservices & High-Availability.',
      },
    });
    console.log(`✅ Đã tạo Member: ${member.name} (${member.id})`);
  } else {
    console.log(`ℹ️ Đã tìm thấy Member: ${member.name} (${member.id})`);
  }

  // 3. Tìm hoặc tạo Project (PAY-V2)
  let project = await prisma.project.findFirst({
    where: { code: 'PAY-V2' },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        code: 'PAY-V2',
        name: 'Hệ thống Cổng Thanh toán & Ví Điện tử V2',
        description: 'Tái thiết kế hệ thống thanh toán cốt lõi với khả năng mở rộng cao.',
        owner_id: user.id,
        priority: Priority.HIGH,
      },
    });
    console.log(`✅ Đã tạo Project: ${project.name} (${project.id})`);
  } else {
    console.log(`ℹ️ Đã tìm thấy Project: ${project.name} (${project.id})`);
  }

  // Gắn member vào project nếu chưa có
  const existingPm = await prisma.projectMember.findFirst({
    where: { project_id: project.id, member_id: member.id },
  });
  if (!existingPm) {
    await prisma.projectMember.create({
      data: {
        project_id: project.id,
        member_id: member.id,
        project_role: 'Lead Backend Developer',
        allocation_percent: 100,
        joined_at: new Date('2026-01-01'),
      },
    });
  }

  // 4. Tạo các cuộc họp thật trong PostgreSQL
  const now = new Date();
  
  // Meeting 1: Hôm nay lúc 15:30
  const meetingTimeToday = new Date(now);
  meetingTimeToday.setHours(15, 30, 0, 0);
  const meetingEndToday = new Date(now);
  meetingEndToday.setHours(16, 15, 0, 0);

  let meeting1 = await prisma.meeting.findFirst({
    where: {
      owner_id: user.id,
      title: { contains: 'Cuộc họp 1-on-1: Trao đổi lộ trình & OKR' },
    },
  });

  if (!meeting1) {
    meeting1 = await prisma.meeting.create({
      data: {
        title: 'Cuộc họp 1-on-1: Trao đổi lộ trình & OKR với Senior Backend Dev',
        description: 'Phòng họp trực tuyến / Bàn thảo luận kỹ thuật. Chuẩn bị agenda đánh giá hiệu suất quý.',
        location: 'Google Meet',
        meeting_url: 'https://meet.google.com/leader-1on1-kiet',
        start_time: meetingTimeToday,
        end_time: meetingEndToday,
        status: MeetingStatus.UPCOMING,
        agenda: '- Rà soát OKR quý hiện tại của đội ngũ Backend\n- Tháo gỡ các điểm nghẽn kiến trúc High-Availability và Database Sharding\n- Định hướng phát triển năng lực cá nhân và đánh giá hiệu suất',
        notes: 'Cần mang theo báo cáo benchmark hiệu năng Redis & PostgreSQL.',
        project_id: project.id,
        member_id: member.id,
        owner_id: user.id,
      },
    });
    console.log(`✅ Đã tạo Meeting 1: ${meeting1.title} (${meeting1.id})`);
  }

  // Meeting 2: Ngày mai lúc 09:30
  const meetingTimeTomorrow = new Date(now);
  meetingTimeTomorrow.setDate(meetingTimeTomorrow.getDate() + 1);
  meetingTimeTomorrow.setHours(9, 30, 0, 0);
  const meetingEndTomorrow = new Date(meetingTimeTomorrow);
  meetingEndTomorrow.setHours(10, 30, 0, 0);

  let meeting2 = await prisma.meeting.findFirst({
    where: {
      owner_id: user.id,
      title: { contains: 'Sprint Review & Tech Debt Sync' },
    },
  });

  if (!meeting2) {
    meeting2 = await prisma.meeting.create({
      data: {
        title: 'Họp điều phối kỹ thuật tuần: Sprint Review & Tech Debt Sync',
        description: 'Rà soát các hạng mục nợ kỹ thuật tồn đọng và thống nhất kế hoạch triển khai sprint tới.',
        location: 'Phòng họp Tokyo (Tầng 8) & Google Meet',
        meeting_url: 'https://meet.google.com/leader-tech-sprint',
        start_time: meetingTimeTomorrow,
        end_time: meetingEndTomorrow,
        status: MeetingStatus.UPCOMING,
        agenda: '- Demo các tính năng cốt lõi hoàn thiện trong sprint\n- Đánh giá các rủi ro nợ kỹ thuật (Tech Debt) phát sinh từ module Payment Gateway\n- Thống nhất backlog ưu tiên cho sprint tuần tới',
        project_id: project.id,
        owner_id: user.id,
      },
    });
    console.log(`✅ Đã tạo Meeting 2: ${meeting2.title} (${meeting2.id})`);
  }

  // 5. Tạo các Task quá hạn thật trong PostgreSQL
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  let task1 = await prisma.task.findFirst({
    where: {
      owner_id: user.id,
      title: { contains: 'Hoàn thiện kiến trúc High-Availability cho Payment Service' },
    },
  });

  if (!task1) {
    task1 = await prisma.task.create({
      data: {
        title: 'Hoàn thiện kiến trúc High-Availability cho Payment Service',
        description: 'Dự án PAY-V2: Hạn chót ngày hôm qua, hiện tại chưa được hoàn thành.',
        priority: Priority.HIGH,
        status: TaskStatus.TODO,
        due_date: twoDaysAgo,
        due_time: '17:00',
        weight: 4,
        project_id: project.id,
        member_id: member.id,
        owner_id: user.id,
      },
    });
    console.log(`✅ Đã tạo Task quá hạn 1: ${task1.title} (${task1.id})`);
  } else {
    await prisma.task.update({
      where: { id: task1.id },
      data: { due_date: twoDaysAgo, status: TaskStatus.TODO },
    });
  }

  let task2 = await prisma.task.findFirst({
    where: {
      owner_id: user.id,
      title: { contains: 'Xác nhận thẩm định mã nguồn bảo mật' },
    },
  });

  if (!task2) {
    task2 = await prisma.task.create({
      data: {
        title: 'Xác nhận thẩm định mã nguồn bảo mật (Security PR)',
        description: 'Đã gửi yêu cầu tới DevOps Team cách đây 3 ngày nhưng chưa nhận được phản hồi.',
        priority: Priority.CRITICAL,
        status: TaskStatus.TODO,
        due_date: threeDaysAgo,
        due_time: '18:00',
        weight: 3,
        project_id: project.id,
        owner_id: user.id,
      },
    });
    console.log(`✅ Đã tạo Task quá hạn 2: ${task2.title} (${task2.id})`);
  } else {
    await prisma.task.update({
      where: { id: task2.id },
      data: { due_date: threeDaysAgo, status: TaskStatus.TODO },
    });
  }

  // 6. Tạo Follow-up quá hạn trong PostgreSQL
  let followUp = await prisma.followUp.findFirst({
    where: {
      owner_id: user.id,
      title: { contains: 'Xác nhận thẩm định mã nguồn bảo mật' },
    },
  });

  if (!followUp) {
    followUp = await prisma.followUp.create({
      data: {
        title: 'Xác nhận thẩm định mã nguồn bảo mật (Security PR)',
        waiting_for: 'DevOps Team',
        follow_up_date: twoDaysAgo,
        status: FollowUpStatus.WAITING,
        note: 'Đã gửi yêu cầu rà soát cấu hình TLS 1.3 và Secret Vault.',
        project_id: project.id,
        owner_id: user.id,
      },
    });
    console.log(`✅ Đã tạo Follow-up: ${followUp.title} (${followUp.id})`);
  }

  // 7. Tạo Risk thật trong PostgreSQL
  let risk = await prisma.risk.findFirst({
    where: {
      owner_id: user.id,
      title: { contains: 'Cổng thanh toán đối tác tăng độ trễ bất thường' },
    },
  });

  if (!risk) {
    risk = await prisma.risk.create({
      data: {
        title: 'Rủi ro báo động: Cổng thanh toán đối tác tăng độ trễ bất thường',
        description: 'Ma trận rủi ro ghi nhận xác suất Vừa x Ảnh hưởng Nghiêm trọng (Medium x Critical).',
        severity: Priority.CRITICAL,
        probability: Priority.MEDIUM,
        status: RiskStatus.OPEN,
        mitigation: 'Thiết lập Circuit Breaker tự động failover sang cổng thanh toán dự phòng B.',
        project_id: project.id,
        owner_id: user.id,
      },
    });
    console.log(`✅ Đã tạo Risk: ${risk.title} (${risk.id})`);
  }

  // 8. Tạo Decision thật trong PostgreSQL
  let decision = await prisma.decision.findFirst({
    where: {
      owner_id: user.id,
      title: { contains: 'Quyết định chuyển sang Monorepo với Turborepo' },
    },
  });

  const nextFriday = new Date(now);
  nextFriday.setDate(nextFriday.getDate() + 4);

  if (!decision) {
    decision = await prisma.decision.create({
      data: {
        title: 'Quyết định chuyển sang Monorepo với Turborepo và pnpm',
        context: 'Cần đồng bộ hoá type an toàn giữa Frontend Next.js và Backend NestJS.',
        options_considered: '1. Tiếp tục giữ 2 repo tách biệt\n2. Chuyển sang Nx Monorepo\n3. Chuyển sang Turborepo + pnpm (Đã chọn)',
        decision: 'Sử dụng Turborepo kết hợp pnpm workspace.',
        reason: 'Tối ưu tốc độ build pipeline, chia sẻ package @leaderos/shared-types tức thời.',
        expected_result: 'Giảm 50% thời gian sync model API và loại trừ hoàn toàn sai lệch hợp đồng API.',
        status: DecisionStatus.REVIEW_PENDING,
        decision_date: threeDaysAgo,
        review_date: nextFriday,
        project_id: project.id,
        owner_id: user.id,
      },
    });
    console.log(`✅ Đã tạo Decision: ${decision.title} (${decision.id})`);
  }

  // 9. Tạo Notifications thật trong SQL, liên kết chính xác bằng Khóa Ngoại (Foreign Keys)
  // Xoá thông báo cũ của user để nạp bộ mới sạch sẽ
  await prisma.notification.deleteMany({
    where: { user_id: user.id },
  });

  const notifsToInsert = [
    {
      user_id: user.id,
      type: NotificationType.OVERDUE,
      title: 'Nhiệm vụ quá hạn: Hoàn thiện kiến trúc High-Availability cho Payment Service',
      description: 'Dự án PAY-V2: Hạn chót ngày hôm qua, hiện tại chưa được hoàn thành.',
      priority: Priority.HIGH,
      read: false,
      action_url: '/tasks',
      action_label: 'Xem công việc',
      time_hint: 'Quá hạn 1 ngày',
      entity_type: 'TASK',
      task_id: task1.id,
    },
    {
      user_id: user.id,
      type: NotificationType.MEETING,
      title: 'Cuộc họp 1-on-1: Trao đổi lộ trình & OKR với Senior Backend Dev',
      description: 'Phòng họp trực tuyến / Bàn thảo luận kỹ thuật. Chuẩn bị agenda đánh giá hiệu suất quý.',
      priority: Priority.HIGH,
      read: false,
      action_url: '/members',
      action_label: 'Xem thành viên',
      time_hint: 'Hôm nay lúc 15:30 (Còn 15 phút)',
      entity_type: 'MEETING',
      meeting_id: meeting1.id,
    },
    {
      user_id: user.id,
      type: NotificationType.OVERDUE,
      title: 'Chờ phản hồi quá hạn: Xác nhận thẩm định mã nguồn bảo mật (Security PR)',
      description: 'Đã gửi yêu cầu tới DevOps Team cách đây 3 ngày nhưng chưa nhận được phản hồi.',
      priority: Priority.MEDIUM,
      read: false,
      action_url: '/today',
      action_label: 'Xử lý ngay',
      time_hint: 'Quá hạn 2 ngày',
      entity_type: 'FOLLOW_UP',
      follow_up_id: followUp.id,
      task_id: task2.id,
    },
    {
      user_id: user.id,
      type: NotificationType.MEETING,
      title: 'Họp điều phối kỹ thuật tuần: Sprint Review & Tech Debt Sync',
      description: 'Rà soát các hạng mục nợ kỹ thuật tồn đọng và thống nhất kế hoạch triển khai sprint tới.',
      priority: Priority.MEDIUM,
      read: false,
      action_url: '/weekly',
      action_label: 'Xem kế hoạch tuần',
      time_hint: 'Ngày mai lúc 09:30',
      entity_type: 'MEETING',
      meeting_id: meeting2.id,
    },
    {
      user_id: user.id,
      type: NotificationType.RISK,
      title: 'Rủi ro báo động: Cổng thanh toán đối tác tăng độ trễ bất thường',
      description: 'Ma trận rủi ro ghi nhận xác suất Vừa x Ảnh hưởng Nghiêm trọng (Medium x Critical).',
      priority: Priority.CRITICAL,
      read: true,
      action_url: '/management/risks',
      action_label: 'Xem ma trận rủi ro',
      time_hint: 'Cập nhật 1 giờ trước',
      entity_type: 'RISK',
      risk_id: risk.id,
    },
    {
      user_id: user.id,
      type: NotificationType.DECISION,
      title: 'Đến hạn đánh giá lại: Quyết định chuyển sang Monorepo với Turborepo',
      description: 'Định kỳ 3 tháng: Đối chiếu tốc độ build CI/CD thực tế so với kỳ vọng ban đầu.',
      priority: Priority.MEDIUM,
      read: true,
      action_url: '/management/decisions',
      action_label: 'Đánh giá quyết định',
      time_hint: 'Hạn: Thứ Sáu tuần này',
      entity_type: 'DECISION',
      decision_id: decision.id,
    },
  ];

  for (const n of notifsToInsert) {
    await prisma.notification.create({ data: n });
  }

  console.log(`🎉 Đã khởi tạo thành công ${notifsToInsert.length} thông báo thật liên kết 100% với các bảng SQL!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu thông báo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
