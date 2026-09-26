export const ProjectStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  AT_RISK: 'AT_RISK',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ProgressMode = {
  MANUAL: 'MANUAL',
  AUTO: 'AUTO',
} as const;
export type ProgressMode = (typeof ProgressMode)[keyof typeof ProgressMode];

export const HealthStatus = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  RED: 'RED',
} as const;
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const TaskStatus = {
  TODO: 'TODO',
  DOING: 'DOING',
  WAITING: 'WAITING',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const MilestoneStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const FollowUpStatus = {
  WAITING: 'WAITING',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
} as const;
export type FollowUpStatus = (typeof FollowUpStatus)[keyof typeof FollowUpStatus];

export const NoteType = {
  WORK: 'WORK',
  IDEA: 'IDEA',
  TECHNICAL: 'TECHNICAL',
  MEETING: 'MEETING',
  GENERAL: 'GENERAL',
} as const;
export type NoteType = (typeof NoteType)[keyof typeof NoteType];

export const LearningStatus = {
  BACKLOG: 'BACKLOG',
  LEARNING: 'LEARNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const;
export type LearningStatus = (typeof LearningStatus)[keyof typeof LearningStatus];

export const Severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const Probability = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type Probability = (typeof Probability)[keyof typeof Probability];

export const RiskStatus = {
  OPEN: 'OPEN',
  MONITORING: 'MONITORING',
  MITIGATED: 'MITIGATED',
  CLOSED: 'CLOSED',
} as const;
export type RiskStatus = (typeof RiskStatus)[keyof typeof RiskStatus];

export const IncidentStatus = {
  OPEN: 'OPEN',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const DecisionStatus = {
  DECIDED: 'DECIDED',
  REVIEW_PENDING: 'REVIEW_PENDING',
  REVIEWED: 'REVIEWED',
} as const;
export type DecisionStatus = (typeof DecisionStatus)[keyof typeof DecisionStatus];

export const ReminderEntity = {
  TASK: 'TASK',
  FOLLOW_UP: 'FOLLOW_UP',
  PROJECT: 'PROJECT',
  MILESTONE: 'MILESTONE',
  LEARNING: 'LEARNING',
  DECISION_REVIEW: 'DECISION_REVIEW',
} as const;
export type ReminderEntity = (typeof ReminderEntity)[keyof typeof ReminderEntity];

export const WeeklyPlanStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;
export type WeeklyPlanStatus = (typeof WeeklyPlanStatus)[keyof typeof WeeklyPlanStatus];

export const NeedAttentionRuleCode = {
  RULE_TASK_OVERDUE_OR_URGENT: 'RULE_TASK_OVERDUE_OR_URGENT',
  RULE_MILESTONE_AT_RISK: 'RULE_MILESTONE_AT_RISK',
  RULE_PROJECT_HEALTH_RISK: 'RULE_PROJECT_HEALTH_RISK',
  RULE_FOLLOWUP_DELAYED: 'RULE_FOLLOWUP_DELAYED',
} as const;
export type NeedAttentionRuleCode =
  (typeof NeedAttentionRuleCode)[keyof typeof NeedAttentionRuleCode];

export const NeedAttentionSeverity = {
  CRITICAL: 'CRITICAL',
  WARNING: 'WARNING',
  ATTENTION: 'ATTENTION',
} as const;
export type NeedAttentionSeverity =
  (typeof NeedAttentionSeverity)[keyof typeof NeedAttentionSeverity];

export const MeetingStatus = {
  UPCOMING: 'UPCOMING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type MeetingStatus = (typeof MeetingStatus)[keyof typeof MeetingStatus];

export const NotificationType = {
  OVERDUE: 'OVERDUE',
  MEETING: 'MEETING',
  RISK: 'RISK',
  DECISION: 'DECISION',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

