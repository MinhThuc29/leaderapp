export interface ApiMeta {
  timestamp: string;
  path?: string;
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export interface HealthCheckData {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  environment: string;
  version: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  title?: string | null;
  phone?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  avatar_url?: string | null;
  title?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}

// ==============================================================================
// Members Types
// ==============================================================================
export interface MemberDto {
  id: string;
  name: string;
  nickname?: string | null | undefined;
  role: string;
  level?: string | null | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  active: boolean;
  notes?: string | null | undefined;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberInput {
  name: string;
  nickname?: string | undefined;
  role: string;
  level?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  active?: boolean | undefined;
  notes?: string | undefined;
}

export interface UpdateMemberInput {
  name?: string | undefined;
  nickname?: string | undefined;
  role?: string | undefined;
  level?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  active?: boolean | undefined;
  notes?: string | undefined;
}

// ==============================================================================
// Projects Types
// ==============================================================================
import {
  ProjectStatus,
  ProgressMode,
  HealthStatus,
  Priority,
  MilestoneStatus,
  TaskStatus,
  FollowUpStatus,
  NoteType,
  LearningStatus,
  WeeklyPlanStatus,
  NeedAttentionRuleCode,
  NeedAttentionSeverity,
  Severity,
  Probability,
  RiskStatus,
  IncidentStatus,
  DecisionStatus,
  MeetingStatus,
  NotificationType,
} from './enums';

export interface ProjectMemberDto {
  id: string;
  project_id: string;
  member_id: string;
  project_role: string;
  allocation_percent?: number | null | undefined;
  joined_at: string;
  left_at?: string | null | undefined;
  member?: MemberDto | undefined;
}

export interface ProjectDto {
  id: string;
  name: string;
  code: string;
  description?: string | null | undefined;
  status: ProjectStatus;
  progress_mode: ProgressMode;
  manual_progress: number;
  start_date?: string | null | undefined;
  target_date?: string | null | undefined;
  completed_date?: string | null | undefined;
  priority: Priority;
  health_status: HealthStatus;
  leader_note?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project_members?: ProjectMemberDto[] | undefined;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  description?: string | undefined;
  status?: ProjectStatus | undefined;
  progress_mode?: ProgressMode | undefined;
  manual_progress?: number | undefined;
  start_date?: string | undefined;
  target_date?: string | undefined;
  priority?: Priority | undefined;
  health_status?: HealthStatus | undefined;
  leader_note?: string | undefined;
}

export interface UpdateProjectInput {
  name?: string | undefined;
  code?: string | undefined;
  description?: string | undefined;
  status?: ProjectStatus | undefined;
  progress_mode?: ProgressMode | undefined;
  manual_progress?: number | undefined;
  start_date?: string | undefined;
  target_date?: string | undefined;
  completed_date?: string | undefined;
  priority?: Priority | undefined;
  health_status?: HealthStatus | undefined;
  leader_note?: string | undefined;
}

export interface AssignMemberInput {
  member_id: string;
  project_role: string;
  allocation_percent?: number | undefined;
  joined_at?: string | undefined;
}

// ==============================================================================
// Milestones Types
// ==============================================================================
export interface MilestoneDto {
  id: string;
  project_id: string;
  title: string;
  description?: string | null | undefined;
  status: MilestoneStatus;
  target_date: string;
  completed_date?: string | null | undefined;
  progress: number;
  order: number;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean | undefined;
  tasks_count?: number | undefined;
  tasks_done_count?: number | undefined;
}

export interface CreateMilestoneInput {
  project_id: string;
  title: string;
  description?: string | undefined;
  status?: MilestoneStatus | undefined;
  target_date: string;
  progress?: number | undefined;
  order?: number | undefined;
}

export interface UpdateMilestoneInput {
  title?: string | undefined;
  description?: string | undefined;
  status?: MilestoneStatus | undefined;
  target_date?: string | undefined;
  completed_date?: string | null | undefined;
  progress?: number | undefined;
  order?: number | undefined;
}

// ==============================================================================
// Tasks & Task Status History Types
// ==============================================================================
export interface TaskStatusHistoryDto {
  id: string;
  task_id: string;
  from_status?: TaskStatus | null | undefined;
  to_status: TaskStatus;
  note?: string | null | undefined;
  changed_at: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string | null | undefined;
  priority: Priority;
  status: TaskStatus;
  due_date?: string | null | undefined;
  due_time?: string | null | undefined;
  weight: number;
  completed_at?: string | null | undefined;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
  milestone_id?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean | undefined;
  assignee?: MemberDto | undefined;
  project?: { id: string; name: string; code: string } | undefined;
  milestone?: { id: string; title: string; status: MilestoneStatus } | undefined;
  task_status_history?: TaskStatusHistoryDto[] | undefined;
}

export interface CreateTaskInput {
  title: string;
  description?: string | undefined;
  priority?: Priority | undefined;
  status?: TaskStatus | undefined;
  due_date?: string | undefined;
  due_time?: string | undefined;
  weight?: number | undefined;
  project_id?: string | undefined;
  member_id?: string | undefined;
  assignee_id?: string | undefined;
  milestone_id?: string | undefined;
}

export interface UpdateTaskInput {
  title?: string | undefined;
  description?: string | undefined;
  priority?: Priority | undefined;
  status?: TaskStatus | undefined;
  due_date?: string | null | undefined;
  due_time?: string | null | undefined;
  weight?: number | undefined;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
  assignee_id?: string | null | undefined;
  milestone_id?: string | null | undefined;
  status_note?: string | undefined;
}

export interface UpdateTaskStatusInput {
  status: TaskStatus;
  note?: string | undefined;
}

// ==============================================================================
// Project Progress Snapshots Types
// ==============================================================================
export interface ProjectProgressSnapshotDto {
  id: string;
  project_id: string;
  progress: number;
  mode: ProgressMode;
  health_status: HealthStatus;
  note?: string | null | undefined;
  captured_at: string;
}

// ==============================================================================
// Follow-ups Types
// ==============================================================================
export interface FollowUpDto {
  id: string;
  title: string;
  waiting_for: string;
  follow_up_date: string; // YYYY-MM-DD
  status: FollowUpStatus;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
  note?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean | undefined;
  project_name?: string | null | undefined;
  member_name?: string | null | undefined;
  project?: { id: string; name: string; code: string } | undefined;
  member?: MemberDto | undefined;
}

export interface CreateFollowUpInput {
  title: string;
  waiting_for: string;
  follow_up_date: string; // YYYY-MM-DD
  status?: FollowUpStatus | undefined;
  project_id?: string | undefined;
  member_id?: string | undefined;
  note?: string | undefined;
}

export interface UpdateFollowUpInput {
  title?: string | undefined;
  waiting_for?: string | undefined;
  follow_up_date?: string | undefined;
  status?: FollowUpStatus | undefined;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
  note?: string | null | undefined;
}

// ==============================================================================
// Tags & Knowledge Base Types
// ==============================================================================
export interface TagDto {
  id: string;
  name: string;
  color?: string | null | undefined;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// Notes & Quick Note Types
// ==============================================================================
export interface NoteDto {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  category?: NoteType | undefined;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
  is_pinned: boolean;
  source: string;
  converted_to?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[] | undefined;
  project?: { id: string; name: string; code: string } | undefined;
  member?: MemberDto | undefined;
}

export interface CreateQuickNoteInput {
  content: string;
  title?: string | undefined;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  type?: NoteType | undefined;
  category?: NoteType | undefined;
  project_id?: string | undefined;
  member_id?: string | undefined;
  is_pinned?: boolean | undefined;
  tags?: string[] | undefined;
}

export interface UpdateNoteInput {
  title?: string | undefined;
  content?: string | undefined;
  type?: NoteType | undefined;
  category?: NoteType | undefined;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
  is_pinned?: boolean | undefined;
  tags?: string[] | undefined;
}

// ==============================================================================
// Lessons Learned Types (5-part structured knowledge)
// ==============================================================================
export interface LessonLearnedDto {
  id: string;
  title: string;
  situation: string; // Hoàn cảnh / Context
  problem: string;   // Vấn đề
  root_cause: string;// Nguyên nhân gốc rễ
  lesson: string;    // Bài học rút ra
  future_action: string; // Hành động tương lai
  project_id?: string | null | undefined;
  incident_id?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[] | undefined;
  project?: { id: string; name: string; code: string } | undefined;
}

export interface CreateLessonLearnedInput {
  title: string;
  situation?: string | undefined;
  context?: string | undefined; // alias for situation
  problem: string;
  root_cause: string;
  lesson: string;
  future_action: string;
  project_id?: string | undefined;
  incident_id?: string | undefined;
  tags?: string[] | undefined;
}

export interface UpdateLessonLearnedInput {
  title?: string | undefined;
  situation?: string | undefined;
  context?: string | undefined;
  problem?: string | undefined;
  root_cause?: string | undefined;
  lesson?: string | undefined;
  future_action?: string | undefined;
  project_id?: string | null | undefined;
  incident_id?: string | null | undefined;
  tags?: string[] | undefined;
}

// ==============================================================================
// Learning Items Types (Learning List)
// ==============================================================================
export interface LearningItemDto {
  id: string;
  title: string;
  topic?: string | undefined; // alias for title
  category?: string | null | undefined;
  description?: string | null | undefined;
  priority: Priority;
  status: LearningStatus;
  target_date?: string | null | undefined;
  resource_url?: string | null | undefined;
  source_url?: string | null | undefined; // alias for resource_url
  notes?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLearningItemInput {
  title?: string | undefined;
  topic?: string | undefined;
  category?: string | undefined;
  description?: string | undefined;
  priority?: Priority | undefined;
  status?: LearningStatus | string | undefined;
  target_date?: string | undefined;
  resource_url?: string | undefined;
  source_url?: string | undefined;
  notes?: string | undefined;
}

export interface UpdateLearningItemInput {
  title?: string | undefined;
  topic?: string | undefined;
  category?: string | null | undefined;
  description?: string | null | undefined;
  priority?: Priority | undefined;
  status?: LearningStatus | string | undefined;
  target_date?: string | null | undefined;
  resource_url?: string | null | undefined;
  source_url?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface UpdateLearningStatusInput {
  status: LearningStatus | string;
}

// ==============================================================================
// Today Module Types
// ==============================================================================
export interface TodayStatsDto {
  total_tasks_today: number;
  completed_tasks_today: number;
  overdue_tasks_count: number;
  pending_follow_ups_count: number;
  completion_percentage: number;
}

export interface TodayResponseDto {
  date: string; // YYYY-MM-DD
  formatted_date: string; // e.g. "Thứ Tư, 23/09/2026"
  stats: TodayStatsDto;
  overdue_tasks: TaskDto[];
  today_tasks: TaskDto[];
  completed_today_tasks: TaskDto[];
  pending_follow_ups: FollowUpDto[];
  recent_quick_notes: NoteDto[];
}

export interface RescheduleTomorrowResultDto {
  rescheduled_count: number;
  new_due_date: string;
  message: string;
}

// ==============================================================================
// Weekly Plans & Reviews Types
// ==============================================================================
export interface WeeklyReviewDto {
  id: string;
  weekly_plan_id: string;
  planned: number;
  completed: number;
  blocked: number;
  carried_over: number;
  completion_rate: number;
  summary: string;
  achievements?: string | null | undefined;
  challenges?: string | null | undefined;
  improvements?: string | null | undefined;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlanTaskItemDto {
  id: string;
  weekly_plan_id: string;
  task_id: string;
  planned_status?: TaskStatus | null | undefined;
  result_status?: TaskStatus | null | undefined;
  carried_over: boolean;
  task?: TaskDto | undefined;
}

export interface WeeklyPlanDto {
  id: string;
  project_id: string;
  project_name?: string | undefined;
  project_code?: string | undefined;
  week_number: number;
  year: number;
  goal: string;
  goals?: string | undefined;
  status: WeeklyPlanStatus;
  start_date: string;
  end_date: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  tasks?: WeeklyPlanTaskItemDto[] | undefined;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  review?: WeeklyReviewDto | null | undefined;
}

export interface CreateWeeklyPlanInput {
  project_id: string;
  week_number: number;
  year: number;
  goal?: string | undefined;
  goals?: string | undefined;
  status?: WeeklyPlanStatus | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  task_ids?: string[] | undefined;
}

export interface UpdateWeeklyPlanInput {
  goal?: string | undefined;
  goals?: string | undefined;
  status?: WeeklyPlanStatus | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
}

export interface AssignWeeklyTasksInput {
  task_ids: string[];
}

export interface CreateWeeklyReviewInput {
  summary: string;
  achievements?: string | undefined;
  challenges?: string | undefined;
  improvements?: string | undefined;
  planned?: number | undefined;
  completed?: number | undefined;
  blocked?: number | undefined;
  carried_over?: number | undefined;
  completion_rate?: number | undefined;
}

// ==============================================================================
// Dashboard & Need Attention Engine Types
// ==============================================================================
export interface NeedAttentionItem {
  id: string;
  rule_code: NeedAttentionRuleCode;
  severity: NeedAttentionSeverity;
  title: string;
  reason: string;
  entity_type: 'TASK' | 'MILESTONE' | 'PROJECT' | 'FOLLOW_UP';
  entity_id: string;
  project_id?: string | null | undefined;
  project_name?: string | null | undefined;
  detected_at: string;
  action_hint?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface DashboardProjectItemDto {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  progress: number;
  health_status: HealthStatus;
  priority: Priority;
  target_date?: string | null | undefined;
  members_count: number;
  open_tasks_count: number;
  overdue_tasks_count: number;
}

export interface DashboardWeeklySummaryDto {
  week_number: number;
  year: number;
  total_plans: number;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  plans: WeeklyPlanDto[];
}

export interface DashboardSummaryDto {
  today_summary: {
    tasks_today_count: number;
    overdue_tasks_count: number;
    completed_today_count: number;
    pending_follow_ups_count: number;
  };
  active_projects: DashboardProjectItemDto[];
  weekly_summary: DashboardWeeklySummaryDto;
  pending_follow_ups: FollowUpDto[];
  need_attention: {
    total_count: number;
    critical_count: number;
    warning_count: number;
    attention_count: number;
    items: NeedAttentionItem[];
  };
}

// ==============================================================================
// Risks & Risk Matrix Types
// ==============================================================================
export interface RiskDto {
  id: string;
  project_id: string;
  project_name?: string | undefined;
  project_code?: string | undefined;
  title: string;
  description: string;
  severity: Severity; // Impact
  probability: Probability;
  status: RiskStatus;
  owner_member_id?: string | null | undefined;
  owner_member_name?: string | null | undefined;
  mitigation: string; // Mitigation plan
  due_date?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string; code: string } | undefined;
  owner_member?: MemberDto | undefined;
}

export interface CreateRiskInput {
  project_id: string;
  title: string;
  description?: string | undefined;
  severity?: Severity | undefined;
  impact?: Severity | undefined; // alias for severity
  probability?: Probability | undefined;
  status?: RiskStatus | undefined;
  owner_member_id?: string | undefined;
  mitigation?: string | undefined;
  mitigation_plan?: string | undefined; // alias for mitigation
  due_date?: string | undefined;
}

export interface UpdateRiskInput {
  project_id?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  severity?: Severity | undefined;
  impact?: Severity | undefined;
  probability?: Probability | undefined;
  status?: RiskStatus | undefined;
  owner_member_id?: string | null | undefined;
  mitigation?: string | undefined;
  mitigation_plan?: string | undefined;
  due_date?: string | null | undefined;
}

export interface RiskMatrixCellDto {
  probability: Probability;
  severity: Severity;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  risks: RiskDto[];
}

export interface RiskMatrixDto {
  total_risks: number;
  open_risks: number;
  mitigated_risks: number;
  high_exposure_count: number;
  cells: RiskMatrixCellDto[];
}

// ==============================================================================
// Incidents Types
// ==============================================================================
export interface IncidentDto {
  id: string;
  project_id: string;
  project_name?: string | undefined;
  project_code?: string | undefined;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  detected_at: string;
  resolved_at?: string | null | undefined;
  root_cause?: string | null | undefined;
  solution?: string | null | undefined; // action_taken
  prevention?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string; code: string } | undefined;
  lessons_count?: number | undefined;
}

export interface CreateIncidentInput {
  project_id: string;
  title: string;
  description: string;
  severity?: Severity | undefined;
  status?: IncidentStatus | undefined;
  detected_at?: string | undefined;
  resolved_at?: string | undefined;
  root_cause?: string | undefined;
  solution?: string | undefined;
  action_taken?: string | undefined; // alias for solution
  prevention?: string | undefined;
}

export interface UpdateIncidentInput {
  project_id?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  severity?: Severity | undefined;
  status?: IncidentStatus | undefined;
  detected_at?: string | undefined;
  resolved_at?: string | null | undefined;
  root_cause?: string | null | undefined;
  solution?: string | null | undefined;
  action_taken?: string | null | undefined;
  prevention?: string | null | undefined;
}

export interface ConvertIncidentToLessonInput {
  title?: string | undefined;
  situation?: string | undefined;
  problem?: string | undefined;
  root_cause?: string | undefined;
  lesson: string;
  future_action: string;
  tags?: string[] | undefined;
}

// ==============================================================================
// Decisions Types (Decision Log & Review)
// ==============================================================================
export interface DecisionDto {
  id: string;
  title: string;
  project_id?: string | null | undefined;
  project_name?: string | null | undefined;
  project_code?: string | null | undefined;
  context: string;
  options_considered: string;
  decision: string; // chosen_option
  reason: string;   // rationale
  expected_result: string; // expected_outcome
  actual_result?: string | null | undefined;
  decision_date: string;
  review_date?: string | null | undefined;
  status: DecisionStatus;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string; code: string } | undefined;
  is_review_overdue?: boolean | undefined;
}

export interface CreateDecisionInput {
  title: string;
  project_id?: string | undefined;
  context: string;
  options_considered: string;
  decision?: string | undefined;
  chosen_option?: string | undefined; // alias for decision
  reason?: string | undefined;
  rationale?: string | undefined;     // alias for reason
  expected_result?: string | undefined;
  expected_outcome?: string | undefined; // alias for expected_result
  actual_result?: string | undefined;
  decision_date?: string | undefined;
  review_date?: string | undefined;
  status?: DecisionStatus | undefined;
}

export interface UpdateDecisionInput {
  title?: string | undefined;
  project_id?: string | null | undefined;
  context?: string | undefined;
  options_considered?: string | undefined;
  decision?: string | undefined;
  chosen_option?: string | undefined;
  reason?: string | undefined;
  rationale?: string | undefined;
  expected_result?: string | undefined;
  expected_outcome?: string | undefined;
  actual_result?: string | null | undefined;
  decision_date?: string | undefined;
  review_date?: string | null | undefined;
  status?: DecisionStatus | undefined;
}

export interface ReviewDecisionInput {
  actual_result: string;
  notes?: string | undefined;
}

// ==============================================================================
// Meetings Types
// ==============================================================================
export interface MeetingDto {
  id: string;
  title: string;
  description?: string | null | undefined;
  location?: string | null | undefined;
  meeting_url?: string | null | undefined;
  start_time: string;
  end_time?: string | null | undefined;
  status: MeetingStatus;
  agenda?: string | null | undefined;
  notes?: string | null | undefined;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string; code: string } | undefined;
  member?: MemberDto | undefined;
}

export interface CreateMeetingInput {
  title: string;
  description?: string | undefined;
  location?: string | undefined;
  meeting_url?: string | undefined;
  start_time: string;
  end_time?: string | undefined;
  status?: MeetingStatus | undefined;
  agenda?: string | undefined;
  notes?: string | undefined;
  project_id?: string | undefined;
  member_id?: string | undefined;
}

export interface UpdateMeetingInput {
  title?: string | undefined;
  description?: string | null | undefined;
  location?: string | null | undefined;
  meeting_url?: string | null | undefined;
  start_time?: string | undefined;
  end_time?: string | null | undefined;
  status?: MeetingStatus | undefined;
  agenda?: string | null | undefined;
  notes?: string | null | undefined;
  project_id?: string | null | undefined;
  member_id?: string | null | undefined;
}

// ==============================================================================
// Notifications Types
// ==============================================================================
export interface NotificationDto {
  id: string;
  user_id: string;
  type: 'overdue' | 'meeting' | 'risk' | 'decision' | 'system';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  action_url?: string | null | undefined;
  action_label?: string | null | undefined;
  time_hint?: string | null | undefined;
  entity_type?: string | null | undefined;
  task_id?: string | null | undefined;
  meeting_id?: string | null | undefined;
  risk_id?: string | null | undefined;
  decision_id?: string | null | undefined;
  follow_up_id?: string | null | undefined;
  created_at: string;
  updated_at: string;
  meeting?: MeetingDto | null | undefined;
  task?: TaskDto | null | undefined;
}

export interface NotificationListResponse {
  items: NotificationDto[];
  stats: {
    total: number;
    unread: number;
    overdue: number;
    meeting: number;
  };
}




