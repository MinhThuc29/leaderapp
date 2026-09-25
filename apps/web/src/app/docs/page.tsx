'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  Compass,
  ExternalLink,
  FolderKanban,
  HelpCircle,
  Layers,
  Lightbulb,
  Scale,
  Search,
  Sparkles,
  SunMedium,
  Target,
  Users,
  Zap,
} from 'lucide-react';

interface DocSection {
  id: string;
  category: string;
  categoryName: string;
  icon: typeof HelpCircle;
  title: string;
  subtitle: string;
  color: string;
  routeLink: string;
  routeLabel: string;
  highlights: string[];
  steps: { title: string; desc: string }[];
  proTips: string[];
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const docSections: DocSection[] = useMemo(
    () => [
      {
        id: 'vision',
        category: 'core',
        categoryName: 'Triết lý & Kiến trúc',
        icon: Compass,
        title: 'Triết lý & Nguyên tắc cốt lõi của LeaderOS',
        subtitle: 'Hệ điều hành quản trị cá nhân tinh gọn, tối ưu riêng cho 1 Engineering Leader',
        color: 'from-indigo-600 to-indigo-700 text-indigo-400',
        routeLink: '/dashboard',
        routeLabel: 'Xem Bảng điều khiển',
        highlights: [
          'Single-Leader First: Leader là tài khoản đăng nhập duy nhất. Thành viên team (~19 người) không cần tài khoản, không bị xao nhãng.',
          'Vòng lặp quản trị: Thu thập (Capture) ➔ Sắp xếp (Organize) ➔ Thực thi (Execute) ➔ Theo dõi (Track) ➔ Đánh giá (Review) ➔ Đúc kết (Learn) ➔ Ra quyết định (Decide).',
          'Nguyên tắc 5–10 phút/ngày: Thao tác cực nhanh, không sa lầy vào form biểu rườm rà như Jira hay công cụ cộng tác chung.',
          'Dữ liệu trước - AI sau: Toàn bộ dữ liệu tiến độ, rủi ro, bài học được lưu vết lịch sử (history/snapshots) làm nền tảng cho trợ lý AI.',
        ],
        steps: [
          {
            title: '1. Không tạo thêm gánh nặng cho Team',
            desc: 'LeaderOS là cockpit riêng của bạn. Bạn không cần ép team phải cài đặt hay login, dữ liệu do Leader chủ động ghi nhận và kiểm soát.',
          },
          {
            title: '2. Nhịp làm việc hàng ngày (Daily Rhythm)',
            desc: 'Chỉ mất 3 phút đầu ngày để định hình ưu tiên và 2 phút cuối ngày để đánh dấu kết quả và ghi chú phản tư.',
          },
        ],
        proTips: [
          'Dùng tính năng ghi chú nhanh để không bao giờ để sót yêu cầu phát sinh từ Slack/email.',
          'Định kỳ thứ Sáu hàng tuần dành 10 phút làm Weekly Review để tích lũy năng lực lãnh đạo.',
        ],
      },
      {
        id: 'today',
        category: 'execution',
        categoryName: 'Hôm nay & Thực thi',
        icon: SunMedium,
        title: 'Phân hệ Hôm nay (/today) — Cockpit Điều hành Hàng ngày',
        subtitle: 'Tập trung tối đa vào các việc then chốt cần giải quyết trong ngày',
        color: 'from-amber-500 to-amber-600 text-amber-400',
        routeLink: '/today',
        routeLabel: 'Mở trang Hôm nay',
        highlights: [
          'Banner câu hỏi ngày: Kích hoạt tư duy ưu tiên cốt lõi cho ngày làm việc.',
          'Nút 1-Click Dời việc quá hạn: Tự động gom toàn bộ task quá hạn về hôm nay chỉ với một lần nhấn.',
          'Quick Task Capture (15 giây): Ô nhập tác vụ tức thời với Tiêu đề, Mức ưu tiên (Low/Medium/High/Critical), Trọng số (1-5) và Dự án.',
          'Danh mục Chờ phản hồi (Follow-ups Waiting): Lưu vết việc đang đợi người/đơn vị khác trả lời, có hạn chót và tên người phụ trách.',
          'Ghi chú nhanh (Quick Notes): Bắt lấy ý tưởng, ghi nhận cuộc họp 1-on-1 chớp nhoáng.',
        ],
        steps: [
          {
            title: 'Bước 1: Bắt đầu ngày mới',
            desc: 'Nhấp "Dời việc quá hạn" nếu có việc hôm qua chưa kịp xong. Hệ thống sẽ chuyển ngày đến hạn về hôm nay.',
          },
          {
            title: 'Bước 2: Ghi nhận việc phát sinh tức thời',
            desc: 'Gõ tiêu đề vào ô Quick Task đầu trang, chọn dự án và nhấn Enter để thêm vào danh sách trong chưa đầy 15 giây.',
          },
          {
            title: 'Bước 3: Quản lý người đang chặn việc',
            desc: 'Khi bàn giao việc cho thành viên hoặc đối tác, thêm ngay vào mục "Chờ phản hồi" để không bao giờ bị quên.',
          },
        ],
        proTips: [
          'Chỉ nên để từ 3 đến 5 task trọng tâm trong mục "Công việc hôm nay" để duy trì mức độ tập trung cao.',
          'Tận dụng trọng số (Weight) từ 1 đến 5 để phân biệt việc khó/quan trọng với việc hỗ trợ nhỏ.',
        ],
      },
      {
        id: 'tasks',
        category: 'execution',
        categoryName: 'Công việc',
        icon: CheckSquare,
        title: 'Phân hệ Công việc (/tasks) — Tasks Cockpit Đa chiều',
        subtitle: 'Quản lý toàn bộ danh mục công việc với chế độ Bảng & Kanban linh hoạt',
        color: 'from-blue-600 to-blue-700 text-blue-400',
        routeLink: '/tasks',
        routeLabel: 'Mở Sổ Công việc',
        highlights: [
          'Chế độ xem kép: Chuyển đổi mượt mà giữa chế độ Bảng danh sách chi tiết (Table) và Bảng Kanban cột kéo thả trực quan.',
          'Trọng số công việc (Weight 1–5): Phản ánh khối lượng công sức, dùng để tính toán tiến độ dự án tự động chính xác.',
          'Trạng thái 4 bước: TODO (Cần làm) ➔ DOING (Đang làm) ➔ WAITING (Chờ đợi) ➔ DONE (Hoàn thành).',
          'Hộp thoại ghi chú trạng thái (Status Note): Khi chuyển việc sang WAITING hoặc DONE, hệ thống mở hộp thoại yêu cầu ghi chú lý do để lưu vết lịch sử.',
        ],
        steps: [
          {
            title: '1. Sử dụng Bộ lọc Đa tiêu chí',
            desc: 'Lọc nhanh theo Dự án, Mức ưu tiên (Low, Medium, High, Critical) hoặc từ khóa tìm kiếm.',
          },
          {
            title: '2. Cập nhật trạng thái kèm ngữ cảnh',
            desc: 'Mỗi khi chuyển task sang WAITING hoặc DONE, hãy nhập 1 câu giải thích ngắn (ví dụ: "Chờ Tech Lead review PR", "Đã deploy lên staging").',
          },
        ],
        proTips: [
          'Trọng số 5 dành cho các task kiến trúc hoặc tính năng cốt lõi. Trọng số 1 dành cho fix bug nhỏ hoặc tác vụ hành chính.',
        ],
      },
      {
        id: 'projects',
        category: 'management',
        categoryName: 'Dự án & Nhân sự',
        icon: FolderKanban,
        title: 'Phân hệ Dự án (/projects) — Tiến độ, Cột mốc & Nhân sự',
        subtitle: 'Bức tranh toàn cảnh về sức khỏe, mốc chặn và phân bổ nhân lực cho từng dự án',
        color: 'from-emerald-600 to-emerald-700 text-emerald-400',
        routeLink: '/projects',
        routeLabel: 'Mở Danh sách Dự án',
        highlights: [
          'Chỉ số Sức khỏe Dự án (Health): GREEN (Tốt/Đúng hạn), YELLOW (Có rủi ro/Chậm nhẹ), RED (Nguy cấp/Bị nghẽn).',
          'Tiến độ Kép (Tự động vs Thủ công): Tính toán tự động theo tỉ lệ hoàn thành task có trọng số, đồng thời cho phép Leader ghi nhận tiến độ đánh giá chủ quan kèm ghi chú.',
          'Tab Cột mốc (Milestones): Quản lý các thời điểm giao hàng trọng đại (Go-live, UAT, Alpha Release).',
          'Tab Lịch sử tiến độ (Snapshots): Chụp lại biến động % hoàn thành qua từng tuần để đối chiếu tốc độ phát triển.',
          'Tab Thành viên (Members): Phân công 19 thành viên vào dự án với vai trò rõ ràng (Tech Lead, Backend, Frontend, QA).',
        ],
        steps: [
          {
            title: '1. Tạo và phân loại dự án',
            desc: 'Nhập tên, mã dự án (VD: PRJ-01), mục tiêu chính và chọn mức độ sức khỏe ban đầu.',
          },
          {
            title: '2. Phân bổ nhân sự',
            desc: 'Vào chi tiết dự án ➔ Tab Thành viên ➔ Bấm "Phân công thành viên" để gán nhân sự phù hợp từ đội ngũ 19 người.',
          },
          {
            title: '3. Thiết lập Cột mốc then chốt',
            desc: 'Tạo các Milestone có hạn chót cụ thể. Khi đạt được mốc, đánh dấu hoàn thành để cập nhật tiến độ.',
          },
        ],
        proTips: [
          'Khi dự án chuyển sang RED, hãy ngay lập tức mở trang /management/risks để tạo một bản ghi rủi ro hoặc sự cố tương ứng.',
        ],
      },
      {
        id: 'members',
        category: 'management',
        categoryName: 'Dự án & Nhân sự',
        icon: Users,
        title: 'Phân hệ Thành viên (/members) — Quản trị Nguồn lực Team',
        subtitle: 'Theo dõi năng lực, vai trò và phân bổ công việc của 19 thành viên đội ngũ',
        color: 'from-violet-600 to-violet-700 text-violet-400',
        routeLink: '/members',
        routeLabel: 'Mở Bảng Nhân sự',
        highlights: [
          '5 cấp bậc chuẩn: INTERN ➔ JUNIOR ➔ MID ➔ SENIOR ➔ LEAD.',
          'Hồ sơ năng lực cá nhân: Ghi chú điểm mạnh, công nghệ thành thạo, định hướng phát triển của từng thành viên.',
          'Theo dõi phân bổ dự án: Xem thành viên đang tham gia bao nhiêu dự án để tránh tình trạng quá tải hoặc nhàn rỗi.',
          'Trạng thái hoạt động: Quản lý trạng thái Đang làm việc (Active) hoặc Tạm ngưng (Inactive).',
        ],
        steps: [
          {
            title: '1. Ghi nhận thành viên mới',
            desc: 'Nhập họ tên, email công việc, vị trí (Role), cấp bậc (Level) và một vài ghi chú ngắn về kỹ năng sở trường.',
          },
          {
            title: '2. Cập nhật định kỳ sau 1-on-1',
            desc: 'Sau mỗi buổi nói chuyện 1-1, bổ sung ghi chú vào hồ sơ thành viên để phục vụ đánh giá hiệu suất định kỳ.',
          },
        ],
        proTips: [
          'Thành viên trong LeaderOS là đối tượng quản lý, không cần tài khoản đăng nhập để bảo mật quyền riêng tư của Leader.',
        ],
      },
      {
        id: 'weekly',
        category: 'planning',
        categoryName: 'Kế hoạch & Đánh giá',
        icon: CalendarDays,
        title: 'Phân hệ Kế hoạch Tuần (/weekly) — Cam kết & Đánh giá',
        subtitle: 'Khung làm việc theo chu kỳ 7 ngày: Đặt mục tiêu đầu tuần và phản tư cuối tuần',
        color: 'from-cyan-600 to-cyan-700 text-cyan-400',
        routeLink: '/weekly',
        routeLabel: 'Mở Kế hoạch Tuần',
        highlights: [
          'Bộ chọn tuần thông minh: Dễ dàng xem lại các tuần trước đó hoặc lên kế hoạch trước cho các tuần tiếp theo.',
          'Cam kết tuần (Commitments): Định nghĩa mục tiêu trọng điểm theo từng dự án cụ thể.',
          'Gán việc vào tuần: Chọn lọc danh sách task cần đóng trong tuần để tập trung nguồn lực.',
          'Đánh giá tuần (Weekly Review 3 thành phần): Khung phản tư với 3 câu hỏi vàng: Thành tựu (Achievements), Thách thức (Challenges), Bài học cải tiến (Improvements).',
        ],
        steps: [
          {
            title: 'Sáng thứ Hai: Lên khung tuần',
            desc: 'Mở trang /weekly, viết 2-3 cam kết trọng tâm cho tuần và gán các task quan trọng vào kế hoạch.',
          },
          {
            title: 'Chiều thứ Sáu: Thực hiện Weekly Review',
            desc: 'Dành 10 phút điền 3 nội dung: Thành tựu đạt được, Điểm nghẽn gặp phải, và Điều cần cải tiến tuần tới. Bấm Lưu đánh giá.',
          },
        ],
        proTips: [
          'Weekly Review là kho báu lớn nhất giúp Leader nâng cao năng lực quản trị theo thời gian.',
        ],
      },
      {
        id: 'knowledge',
        category: 'learning',
        categoryName: 'Tri thức & Đúc kết',
        icon: BookOpen,
        title: 'Phân hệ Tri thức (/knowledge) — Ghi chú, Bài học & Học tập',
        subtitle: 'Kho tri thức sống của Leader: Ghi chép Markdown, Đúc kết 5 bước, Backlog học tập',
        color: 'from-teal-600 to-teal-700 text-teal-400',
        routeLink: '/knowledge/notes',
        routeLabel: 'Mở Kho Tri thức',
        highlights: [
          'Ghi chú chuyên sâu (/knowledge/notes): Hỗ trợ Markdown, phân loại theo danh mục (Meeting, Tech, 1-on-1, Retro) và gắn thẻ tag linh hoạt.',
          'Bài học kinh nghiệm (/knowledge/lessons): Quy trình đúc kết 5 bước chuẩn: Ngữ cảnh ➔ Vấn đề ➔ Nguyên nhân gốc rễ ➔ Bài học rút ra ➔ Hành động tương lai.',
          'Danh mục học tập (/knowledge/learning): Quản lý lộ trình nâng cấp bản thân với 3 trạng thái: BACKLOG (Cần học) ➔ IN_PROGRESS (Đang học) ➔ COMPLETED (Đã học).',
        ],
        steps: [
          {
            title: '1. Ghi chép tài liệu kỹ thuật & cuộc họp',
            desc: 'Tạo note mới, sử dụng cú pháp Markdown để định dạng mã nguồn, bảng biểu hoặc checklist.',
          },
          {
            title: '2. Đúc kết bài học khi xong dự án/sự cố',
            desc: 'Điền đầy đủ 5 bước để biến trải nghiệm đau thương thành tài sản trí tuệ vô giá cho các dự án kế tiếp.',
          },
        ],
        proTips: [
          'Mỗi bài học kinh nghiệm hay nên được chia sẻ lại cho team trong các buổi Retrospective kỹ thuật.',
        ],
      },
      {
        id: 'management',
        category: 'governance',
        categoryName: 'Quản trị Rủi ro & Quyết định',
        icon: Scale,
        title: 'Phân hệ Quản trị (/management) — Ma trận Rủi ro & Sổ Quyết định',
        subtitle: 'Nâng tầm tư duy lãnh đạo: Quản trị rủi ro chủ động và đo lường hiệu quả quyết định',
        color: 'from-rose-600 to-rose-700 text-rose-400',
        routeLink: '/management/risks',
        routeLabel: 'Mở Quản trị Rủi ro',
        highlights: [
          'Ma trận Rủi ro (Probability × Impact Matrix): Tự động phân loại rủi ro vào lưới nhiệt từ Thấp (Xanh) đến Nghiêm trọng (Đỏ). Nhấp vào ô bất kỳ để lọc nhanh.',
          'Quản lý Sự cố (Incidents): Ghi nhận mức độ nghiêm trọng (Low/Medium/High/Critical), hành động xử lý và nút 1-Click chuyển đổi sự cố thành Bài học kinh nghiệm.',
          'Sổ Nhật ký Quyết định (/management/decisions): Lưu vết bối cảnh ra quyết định, các phương án cân nhắc, lý do chọn và kết quả kỳ vọng.',
          'Cơ chế đối chiếu sau 3-6 tháng (Decision Review): Hệ thống tự nhắc nhở khi đến ngày đánh giá kết quả thực tế để kiểm chứng quyết định.',
        ],
        steps: [
          {
            title: '1. Định vị rủi ro tiềm ẩn',
            desc: 'Khi phát hiện nguy cơ (chậm API, thiếu nhân sự, công nghệ mới), tạo bản ghi rủi ro, chọn xác suất và mức độ tác động.',
          },
          {
            title: '2. Ghi nhận quyết định quan trọng',
            desc: 'Trước khi chốt phương án kiến trúc hoặc tuyển dụng, ghi lại bối cảnh, các lựa chọn đã loại bỏ và ngày cần review lại.',
          },
          {
            title: '3. Đối chiếu kết quả',
            desc: 'Khi đến ngày review, mở quyết định và đánh giá xem kết quả thực tế có đúng như kỳ vọng ban đầu không.',
          },
        ],
        proTips: [
          'Thói quen ghi chép nhật ký quyết định giúp Leader tránh được lỗi thiên vị nhận thức (Hindsight Bias).',
        ],
      },
      {
        id: 'settings',
        category: 'core',
        categoryName: 'Cá nhân hóa & Tiện ích',
        icon: Sparkles,
        title: 'Đa ngôn ngữ & Chế độ Sáng / Tối (i18n & Theme)',
        subtitle: 'Trải nghiệm cá nhân hóa toàn diện theo môi trường làm việc của Leader',
        color: 'from-amber-600 to-rose-600 text-amber-400',
        routeLink: '/dashboard',
        routeLabel: 'Về Bảng điều khiển',
        highlights: [
          'Hỗ trợ 4 ngôn ngữ: Tiếng Việt (🇻🇳 vi), Tiếng Anh (🇬🇧 en), Tiếng Trung Giản thể (🇨🇳 zh-CN), Tiếng Trung Phồn thể (🇹🇼 zh-TW).',
          '3 chế độ màu sắc: Sáng (Light ☀️), Tối (Dark 🌙), Theo hệ điều hành (System 🖥️).',
          'Lưu trữ tự động: Các thiết lập ngôn ngữ và theme được tự động ghi nhớ vào LocalStorage của trình duyệt.',
          'Bảo toàn độ tương phản: Các biến màu sắc Slate và token shadcn/ui chuyển đổi tương phản êm dịu, không gây chói mắt.',
        ],
        steps: [
          {
            title: 'Đổi Theme nhanh',
            desc: 'Nhấp trực tiếp vào biểu tượng Mặt trời/Mặt trăng trên thanh Header góc phải để chọn Sáng, Tối hoặc Hệ thống.',
          },
          {
            title: 'Đổi Ngôn ngữ',
            desc: 'Nhấp vào Avatar góc phải ➔ Chọn menu "Ngôn ngữ" và chọn cờ quốc gia mong muốn.',
          },
        ],
        proTips: [
          'Chế độ System sẽ tự động chuyển sang Dark Mode vào ban đêm nếu hệ điều hành máy tính của bạn kích hoạt chế độ tối.',
        ],
      },
    ],
    [],
  );

  const categories = [
    { id: 'all', label: 'Tất cả chủ đề', icon: Layers },
    { id: 'core', label: 'Triết lý cốt lõi', icon: Compass },
    { id: 'execution', label: 'Hôm nay & Công việc', icon: Zap },
    { id: 'management', label: 'Dự án & Nhân sự', icon: FolderKanban },
    { id: 'planning', label: 'Kế hoạch tuần', icon: CalendarDays },
    { id: 'learning', label: 'Tri thức & Đúc kết', icon: BookOpen },
    { id: 'governance', label: 'Rủi ro & Quyết định', icon: Scale },
  ];

  const filteredSections = useMemo(() => {
    return docSections.filter((section) => {
      const matchCategory = selectedCategory === 'all' || section.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase())) ||
        section.steps.some(
          (s) =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.desc.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return matchCategory && matchQuery;
    });
  }, [docSections, selectedCategory, searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-8 pb-16">
        {/* ========================================================================= */}
        {/* 1. HERO HEADER */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-20 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Sổ tay Vận hành & Hướng dẫn Sử dụng LeaderOS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Trung tâm Hướng dẫn & Tài liệu Vận hành
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              LeaderOS được thiết kế đặc thù dành cho một Engineering Leader quản lý danh mục công
              việc, các dự án trọng yếu, đội ngũ 19 thành viên, bài học kinh nghiệm và các quyết
              định chiến lược. Dưới đây là hướng dẫn chi tiết từng phân hệ giúp bạn vận hành hệ thống
              với hiệu quả cao nhất chỉ trong 5–10 phút mỗi ngày.
            </p>

            {/* Quick search input */}
            <div className="pt-2">
              <div className="relative max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm chức năng, phân hệ, hướng dẫn (vd: rủi ro, dời việc, weekly review)..."
                  className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-foreground"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CATEGORY FILTER PILLS */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-foreground'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. DAILY RITUAL CHECKLIST CARDS */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-foreground">
              Quy trình Chuẩn 5–10 Phút Mỗi Ngày cho Leader
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  1. Đầu ngày (3 phút)
                </span>
                <SunMedium className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mở <strong>/today</strong>, bấm <strong>Dời việc quá hạn</strong> nếu có, xác định 3
                việc quan trọng nhất phải xong trong ngày.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  2. Trong ngày (15 giây)
                </span>
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Có việc mới gõ nhanh vào ô <strong>Quick Task</strong>; việc giao người khác ghi vào{' '}
                <strong>Chờ phản hồi</strong>; ý tưởng chớp nhoáng ghi vào <strong>Quick Notes</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  3. Cuối ngày (2 phút)
                </span>
                <CheckSquare className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tích chọn các việc đã xong, nhập ghi chú ngắn khi cần và kiểm tra thanh tiến độ ngày
                để rời bàn làm việc thảnh thơi.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  4. Thứ Sáu (10 phút)
                </span>
                <Target className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mở <strong>/weekly</strong>, điền 3 câu hỏi <strong>Weekly Review</strong> (Thành tựu,
                Thách thức, Bài học) và lên cam kết cho tuần tới.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. DETAILED GUIDANCE SECTIONS */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
              <p className="text-sm">Không tìm thấy tài liệu phù hợp với từ khóa &quot;{searchQuery}&quot;.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-xs font-semibold text-indigo-400 hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur transition hover:border-slate-700 shadow-xl space-y-6"
                >
                  {/* Section Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                            {sec.categoryName}
                          </span>
                        </div>
                        <h3 className="mt-1 text-lg sm:text-xl font-bold text-foreground tracking-tight">
                          {sec.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{sec.subtitle}</p>
                      </div>
                    </div>

                    <Link
                      href={sec.routeLink}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-750 hover:text-white transition"
                    >
                      <span>{sec.routeLabel}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      Tính năng trọng điểm
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {sec.highlights.map((hl, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step by step practical flow */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-emerald-400" />
                      Hướng dẫn từng bước thực hành
                    </h4>
                    <div className="space-y-2">
                      {sec.steps.map((st, sidx) => (
                        <div
                          key={sidx}
                          className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs space-y-1"
                        >
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              {sidx + 1}
                            </span>
                            <span>{st.title}</span>
                          </div>
                          <p className="text-slate-400 pl-7 leading-relaxed">{st.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro-Tips Callout */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <Lightbulb className="h-4 w-4" />
                      <span>Mẹo thực chiến cho Leader</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 pl-1">
                      {sec.proTips.map((pt, pidx) => (
                        <li key={pidx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
