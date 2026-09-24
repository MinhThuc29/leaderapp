export type BackendLanguage = 'vi' | 'en' | 'zh-CN' | 'zh-TW';

export const DEFAULT_BACKEND_LANGUAGE: BackendLanguage = 'vi';

export function resolveLanguage(acceptLanguageHeader?: string): BackendLanguage {
  if (!acceptLanguageHeader) return DEFAULT_BACKEND_LANGUAGE;

  const header = acceptLanguageHeader.toLowerCase().trim();

  if (header.includes('zh-tw') || header.includes('zh-hk') || header.includes('zh-mo') || header.includes('hant')) {
    return 'zh-TW';
  }
  if (header.includes('zh-cn') || header.includes('zh-sg') || header.includes('zh') || header.includes('hans')) {
    return 'zh-CN';
  }
  if (header.includes('en')) {
    return 'en';
  }
  if (header.includes('vi')) {
    return 'vi';
  }

  return DEFAULT_BACKEND_LANGUAGE;
}

export const HTTP_ERROR_TRANSLATIONS: Record<number, Record<BackendLanguage, string>> = {
  400: {
    vi: 'Yêu cầu không hợp lệ',
    en: 'Bad Request',
    'zh-CN': '无效的请求参数',
    'zh-TW': '無效的請求參數',
  },
  401: {
    vi: 'Yêu cầu đăng nhập để truy cập tài nguyên',
    en: 'Authentication required to access resource',
    'zh-CN': '需要登录以访问该资源',
    'zh-TW': '需要登入以存取該資源',
  },
  403: {
    vi: 'Bạn không có quyền thực hiện thao tác này',
    en: 'You do not have permission to perform this action',
    'zh-CN': '您无权执行此操作',
    'zh-TW': '您無權執行此操作',
  },
  404: {
    vi: 'Không tìm thấy dữ liệu yêu cầu',
    en: 'Requested resource not found',
    'zh-CN': '未找到所请求的数据',
    'zh-TW': '未找到所請求的資料',
  },
  409: {
    vi: 'Dữ liệu đã tồn tại hoặc xảy ra xung đột',
    en: 'Resource conflict or duplicate entry detected',
    'zh-CN': '数据已存在或发生冲突',
    'zh-TW': '資料已存在或發生衝突',
  },
  500: {
    vi: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    en: 'Internal server error. Please try again later.',
    'zh-CN': '服务器内部错误，请稍后重试',
    'zh-TW': '伺服器內部錯誤，請稍後重試',
  },
};

export const COMMON_MESSAGE_TRANSLATIONS: Record<string, Record<BackendLanguage, string>> = {
  unauthorized: {
    vi: 'Yêu cầu đăng nhập',
    en: 'Authentication required',
    'zh-CN': '需要登录',
    'zh-TW': '需要登入',
  },
  'chưa đăng nhập hoặc phiên làm việc đã hết hạn': {
    vi: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn',
    en: 'Not logged in or session has expired',
    'zh-CN': '未登录或会话已过期',
    'zh-TW': '未登入或會話已過期',
  },
  'forbidden resource': {
    vi: 'Truy cập bị từ chối',
    en: 'Access denied',
    'zh-CN': '拒绝访问',
    'zh-TW': '拒絕存取',
  },
  'email hoặc mật khẩu không chính xác': {
    vi: 'Email hoặc mật khẩu không chính xác',
    en: 'Invalid email or password',
    'zh-CN': '邮箱或密码错误',
    'zh-TW': '郵箱或密碼錯誤',
  },
  'project not found': {
    vi: 'Không tìm thấy dự án',
    en: 'Project not found',
    'zh-CN': '未找到项目',
    'zh-TW': '未找到專案',
  },
  'task not found': {
    vi: 'Không tìm thấy công việc',
    en: 'Task not found',
    'zh-CN': '未找到任务',
    'zh-TW': '未找到任務',
  },
  'member not found': {
    vi: 'Không tìm thấy thành viên',
    en: 'Member not found',
    'zh-CN': '未找到成员',
    'zh-TW': '未找到成員',
  },
  'validation failed': {
    vi: 'Dữ liệu không hợp lệ',
    en: 'Validation failed',
    'zh-CN': '数据验证失败',
    'zh-TW': '資料驗證失敗',
  },
};

export function translateErrorMessage(
  rawMessage: string | string[],
  statusCode: number,
  lang: BackendLanguage,
): string | string[] {
  if (Array.isArray(rawMessage)) {
    return rawMessage.map((m) => translateSingleMessage(m, statusCode, lang));
  }
  return translateSingleMessage(rawMessage, statusCode, lang);
}

function translateSingleMessage(
  msg: string,
  statusCode: number,
  lang: BackendLanguage,
): string {
  const normalized = msg.toLowerCase().trim();

  // Match in common dictionary
  if (COMMON_MESSAGE_TRANSLATIONS[normalized]) {
    return COMMON_MESSAGE_TRANSLATIONS[normalized][lang];
  }

  // If status is standard 401/403/404 and message is generic
  if (
    normalized === 'unauthorized' ||
    normalized === 'forbidden' ||
    normalized === 'not found' ||
    normalized === 'internal server error'
  ) {
    if (HTTP_ERROR_TRANSLATIONS[statusCode]) {
      return HTTP_ERROR_TRANSLATIONS[statusCode][lang];
    }
  }

  // Return original msg if no translation needed/found
  return msg;
}
