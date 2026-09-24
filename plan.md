# LeaderOS — Product Plan

> Personal Engineering Leader Operating System  
> Primary user: 1 Leader  
> Managed team: ~19 members  
> Goal: help the Leader capture information, manage work/projects, learn from experience, and make better future decisions.

---

# 1. Product Vision

LeaderOS is a **personal management and decision-support system for a Leader**.

It is not a team collaboration tool, not a Jira clone, and not a generic to-do application.

The Leader is the only active user in the first version.

The system helps the Leader manage:

- Daily work
- Reminders
- Follow-ups
- Projects
- Project progress
- Project members
- Weekly plans
- Milestones
- Notes
- Lessons learned
- Learning topics
- Risks
- Incidents
- Decisions

Long-term direction:

```text
Capture
   ↓
Organize
   ↓
Execute
   ↓
Track
   ↓
Review
   ↓
Learn
   ↓
Analyze
   ↓
Decide
```

---

# 2. Product Principles

## 2.1 Single-user first

MVP has only one real application user:

```text
User = Leader
Member = person managed by Leader
```

Important rule:

```text
User != Member
```

Members do not need accounts.

This keeps the first version simple while preserving the ability to expand later.

---

## 2.2 Fast daily usage

The system must be fast enough to use every day.

Target:

> Daily update time: 5–10 minutes.

Design principles:

- Quick create
- Inline editing
- Minimal required fields
- One-click status updates
- Fast search
- Clear dashboard
- Avoid long forms

---

## 2.3 History first

Important management data must keep historical changes.

Examples:

- Project progress
- Weekly results
- Milestone status
- Task status
- Risk status
- Decision outcomes

Historical data will later support analytics and AI.

---

## 2.4 AI later, data first

Development direction:

```text
Structured Data
    ↓
Reliable Calculations
    ↓
Analytics
    ↓
AI Summary
    ↓
AI Analysis
    ↓
AI Recommendations
    ↓
Scenario / Forecast
```

AI should support decisions, not replace the Leader.

---

# 3. Core Questions the System Must Answer

The Leader should be able to answer quickly:

```text
What do I need to do today?

What needs my attention?

Which projects are progressing well?

Which projects are at risk?

What is blocked?

Who is participating in each project?

What should be completed this week?

What do I need to follow up?

What did I learn?

What should I remember for future projects?

What decisions did I make and were they effective?
```

---

# 4. Main Navigation

```text
Dashboard

My Work
├── Today
├── Tasks
├── Follow-ups
└── Reminders

Projects
├── Active
├── Completed
└── Weekly Plans

Team
├── Members
└── Workload

Knowledge
├── Notes
├── Lessons Learned
└── Learning

Management
├── Risks
├── Incidents
└── Decisions

Settings
```

---

# 5. Dashboard

Dashboard is the management cockpit.

It should show:

- Tasks today
- Overdue tasks
- Follow-ups today
- Reminders
- Active projects
- At-risk projects
- Upcoming milestones
- Weekly progress
- Recent notes
- Recent lessons
- Items requiring attention

Example:

```text
┌────────────────────────────────────────────────────────────┐
│ LeaderOS                                                   │
├─────────────────────────────┬──────────────────────────────┤
│ MY DAY                      │ PROJECT STATUS               │
│                             │                              │
│ Tasks: 7                    │ Active: 7                    │
│ Overdue: 2                  │ At Risk: 2                   │
│ Follow-ups: 3               │ Open Incidents: 1            │
├─────────────────────────────┼──────────────────────────────┤
│ PROJECTS                    │ NEED ATTENTION               │
│ MES A        82%            │ CNC protocol blocked         │
│ AI Vision    65%            │ AI workload high             │
│ Tool Mgmt    95%            │ Acceptance not planned       │
├─────────────────────────────┼──────────────────────────────┤
│ THIS WEEK                   │ RECENT KNOWLEDGE             │
│ Planned: 31                 │ CNC test lesson              │
│ Completed: 24               │ FOCAS technical note         │
│ Blocked: 4                  │ System Design learning       │
└─────────────────────────────┴──────────────────────────────┘
```

Goal:

> Understand the overall situation in less than 30 seconds.

---

# 6. My Work

## 6.1 Today

Show:

- Top priorities
- Due today
- Overdue
- Follow-ups
- Reminders
- Completed today
- Quick Note

---

## 6.2 Tasks

Task fields:

```text
title
description
priority
status
due_date
due_time
related_project
related_member
reminder
tags
```

Statuses:

```text
TODO
DOING
WAITING
DONE
CANCELLED
```

Priority:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 7. Follow-up

Follow-up is different from a normal task.

Used for:

- Waiting for customer
- Waiting for supplier
- Waiting for team member
- Waiting for technical confirmation
- Waiting for quotation

Fields:

```text
title
waiting_for
follow_up_date
status
related_project
note
```

Statuses:

```text
WAITING
RESOLVED
CANCELLED
```

---

# 8. Reminder

Reminder can be connected to:

- Task
- Follow-up
- Project
- Milestone
- Learning item
- Decision review

MVP can support one-time reminders first.

Future:

- Daily
- Weekly
- Monthly
- Scheduled summaries

---

# 9. Project Management

## 9.1 Project status

```text
PLANNING
ACTIVE
ON_HOLD
AT_RISK
COMPLETED
CANCELLED
```

Project list should show:

- Project name
- Status
- Progress
- Deadline
- Members
- Health indicator

Completed projects remain searchable and can appear visually struck through.

---

## 9.2 Project Detail

Recommended tabs:

```text
Overview
Weekly
Milestones
Tasks
Members
Risks
Incidents
Notes
Lessons
Decisions
History
```

Project fields:

```text
name
code
description
status
progress_mode
manual_progress
start_date
target_date
completed_date
priority
health_status
leader_note
```

---

# 10. Project Progress

Support two modes.

## Manual

Leader sets:

```text
0–100%
```

## Automatic

Formula:

```text
sum(weight of DONE tasks)
------------------------- x 100
sum(weight of active tasks)
```

Task weights allow different levels of importance.

Example:

```text
Database design       2
API implementation    4
UI styling            1
Machine integration   5
```

Progress changes should be stored historically.

---

# 11. Project Members

Members do not log in.

Member fields:

```text
name
nickname
role
level
active
notes
```

Project-member relationship:

```text
project
member
project_role
allocation_percent_optional
joined_at
left_at
```

Example:

```text
MES Factory A

Thành      Backend
Lộc        CNC Integration
Linh       Frontend
Thư        QA
```

---

# 12. Milestones

Examples:

```text
Requirement Freeze
Architecture Completed
Development Completed
Integration Test
UAT
Go Live
```

Fields:

```text
project
title
description
status
target_date
completed_date
progress
order
```

Statuses:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
COMPLETED
CANCELLED
```

---

# 13. Weekly Plan

Each project can have a weekly plan.

Example:

```text
Week 39

Goal:
Complete Production Tracking Module

Tasks:
✅ Work Order API
✅ Database
⏳ Dashboard
⚠ CNC Integration
```

Weekly review stores:

```text
planned
completed
blocked
carried_over
completion_rate
summary
```

Historical weekly reviews are important for future analysis.

---

# 14. Notes

Notes are a core feature.

Types:

```text
WORK
IDEA
TECHNICAL
MEETING
GENERAL
```

Fields:

```text
title
content
type
related_project
related_member
tags
is_pinned
created_at
updated_at
```

---

# 15. Quick Note

Global action:

```text
+ Quick Note
```

Quick Note should initially require only text.

After saving, it can be converted to:

```text
Task
Follow-up
Lesson Learned
Learning Item
Technical Note
Idea
```

Goal:

> Capture first, organize later.

---

# 16. Lessons Learned

Lesson Learned is separate from generic Notes.

Fields:

```text
title
project_optional
incident_optional
situation
problem
root_cause
lesson
future_action
tags
```

Example:

```text
Project:
MES Factory A

Problem:
CNC integration delayed 8 days.

Root Cause:
FOCAS connection was tested too late.

Lesson:
Validate CNC connectivity during project setup.

Future Action:
Add Machine Connectivity Test to Week 1.
```

Future AI should be able to retrieve lessons relevant to similar projects.

---

# 17. Learning List

Used for things the Leader wants to study.

Fields:

```text
title
description
priority
status
target_date_optional
resource_url_optional
notes
```

Statuses:

```text
BACKLOG
LEARNING
PAUSED
COMPLETED
```

---

# 18. Risk Management

Fields:

```text
project
title
description
severity
probability
status
owner_member_optional
mitigation
due_date
```

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Statuses:

```text
OPEN
MONITORING
MITIGATED
CLOSED
```

---

# 19. Incident Management

Flow:

```text
Problem
   ↓
Investigation
   ↓
Root Cause
   ↓
Solution
   ↓
Prevention
   ↓
Lesson Learned
```

Fields:

```text
project
title
description
severity
status
detected_at
resolved_at
root_cause
solution
prevention
```

Action:

```text
Convert Incident → Lesson Learned
```

---

# 20. Decision Journal

Purpose:

Store important management decisions and later evaluate whether they worked.

Fields:

```text
title
project_optional
context
options_considered
decision
reason
expected_result
actual_result
decision_date
review_date
status
```

Statuses:

```text
DECIDED
REVIEW_PENDING
REVIEWED
```

Example:

```text
Decision:
Move Thành from Project B to Project A

Reason:
Project A integration risk

Expected:
Recover milestone by 10 Oct

Actual:
Project A recovered
Project B delayed 2 days
```

---

# 21. Need My Attention

Initial version should use rule-based logic, not AI.

Examples:

```text
IF task overdue > 0
→ attention item

IF milestone overdue
→ attention item

IF project deadline <= 14 days
AND progress < 70%
→ warning

IF critical risk exists
→ warning

IF follow_up_date <= today
→ attention item

IF blocked tasks >= 3
→ warning
```

Each warning must explain the reason.

---

# 22. Project Health

Start with transparent logic.

Health dimensions:

```text
Schedule
Execution
Risk
Blockers
```

Example:

```text
GREEN
- no overdue milestones
- blocked tasks < 2
- no high/critical risks

YELLOW
- minor delay
- blocked tasks 2–3
- high risk exists

RED
- critical milestone overdue
- blocked tasks >= 4
- unresolved critical risk
```

Do not create a mysterious score without explanation.

---

# 23. Search

Global search should find:

- Projects
- Tasks
- Members
- Notes
- Lessons Learned
- Learning items
- Decisions

Future AI search can be added later.

---

# 24. Suggested Technology Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query
```

Future analytics:

```text
ECharts
```

---

## Backend

```text
NestJS
TypeScript
REST API
Swagger / OpenAPI
```

---

## Database

```text
PostgreSQL
Prisma
```

---

## Authentication

MVP:

```text
Single Leader account
Email + password
HttpOnly cookie/session
```

Do not implement complex permissions initially.

---

# 25. Suggested Repository Structure

```text
leader-os/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   └── shared-types/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   └── analytics.md
│
├── plan.md
├── README.md
└── docker-compose.yml
```

Recommended:

```text
pnpm workspaces
```

---

# 26. Backend Modules

```text
auth
users
members
projects
milestones
tasks
weekly-plans
notes
lessons
learning
follow-ups
reminders
risks
incidents
decisions
dashboard
analytics
common
```

---

# 27. Core Database Entities

```text
users

members

projects
project_members
project_progress_snapshots

milestones

tasks
task_status_history

weekly_plans
weekly_plan_tasks
weekly_reviews

notes
tags
note_tags

lessons_learned

learning_items

follow_ups

reminders

risks

incidents

decisions
```

---

# 28. Database Design Rules

## Rule 1

Use UUID/CUID IDs.

## Rule 2

Business tables should include:

```text
created_at
updated_at
```

## Rule 3

Preserve history where future analytics may need it.

## Rule 4

Use enums for stable statuses.

## Rule 5

Do not duplicate calculated dashboard totals unless required for performance.

## Rule 6

Prefer soft-delete for important historical records.

---

# 29. API Direction

Base:

```text
/api/v1
```

Examples:

```text
GET    /api/v1/dashboard

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id

GET    /api/v1/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id

GET    /api/v1/notes
POST   /api/v1/notes

GET    /api/v1/lessons
POST   /api/v1/lessons

GET    /api/v1/learning
POST   /api/v1/learning
```

Swagger should document the API.

---

# 30. MVP Pages

```text
/login
/dashboard

/today
/tasks
/follow-ups

/projects
/projects/[id]

/members

/notes
/lessons
/learning

/settings
```

---

# 31. UI Direction

Design goals:

```text
Professional
Fast scanning
Desktop-first
Minimal distraction
Management-oriented
```

Prefer:

- Left sidebar
- Top action bar
- Compact tables
- Status chips
- Progress bars
- Inline editing
- Drawer/modal for quick create

Avoid:

- Excessive gradients
- Glassmorphism
- Too many animations
- Oversized cards
- Decorative charts

---

# 32. Global Quick Create

Always accessible:

```text
+ New
```

Actions:

```text
Task
Note
Follow-up
Project
Lesson
Learning Item
```

Future shortcut:

```text
Ctrl/Cmd + K
```

---

# 33. MVP Functional Scope

The first useful version should support:

```text
[ ] Login
[ ] Manage Members
[ ] Create Projects
[ ] Assign Members to Projects
[ ] Set Project Progress
[ ] Mark Project Completed
[ ] Create Milestones
[ ] Create Tasks
[ ] Manage Today
[ ] Manage Follow-ups
[ ] Create Reminders
[ ] Create Weekly Plans
[ ] Record Weekly Reviews
[ ] Capture Quick Notes
[ ] Store Technical Notes
[ ] Store Lessons Learned
[ ] Maintain Learning List
[ ] Search Knowledge
[ ] View Dashboard
[ ] See Need My Attention
```

---

# 34. Out of Scope for MVP

Do not build initially:

```text
Multi-tenant organizations
Complex RBAC
Member login
Chat
Comments
Mentions
Real-time collaboration
Mobile app
Microservices
Kafka
Kubernetes
Workflow engine
AI agent
Vector database
Automatic forecasting
HRM
CRM
Payroll
Attendance
```

---

# 35. Future Analytics

Metrics:

```text
Project progress trend
Weekly completion rate
Overdue task trend
Blocked task trend
Milestone delay
Project velocity
Member project allocation
Incident frequency
Risk trend
Decision review outcome
```

Analytics should be calculated by backend services.

---

# 36. Future AI Architecture

Future direction:

```text
PostgreSQL
    ↓
Domain Services
    ↓
Calculation Service
    ↓
Management Metrics
    ↓
Context Builder
    ↓
LLM
    ↓
Analysis / Options / Recommendation
    ↓
Leader Decision
```

AI should receive structured context:

```json
{
  "project": {},
  "metrics": {},
  "risks": [],
  "blocked_tasks": [],
  "milestones": [],
  "recent_incidents": [],
  "relevant_lessons": [],
  "recent_decisions": []
}
```

Avoid:

```text
AI → raw database → decide everything
```

---

# 37. Future AI Questions

The system should eventually answer:

```text
What needs my attention today?

Why is Project A slowing down?

Which projects are showing risk patterns?

What recurring problems exist in CNC projects?

Which lessons from past projects are relevant?

What happens if I add another project?

Which members appear overloaded?

Which tasks keep carrying over?

Which decisions should I review?

What management patterns repeatedly cause delays?
```

---

# 38. Decision Support Output

Future recommendation format:

```text
Observation

Evidence

Possible Cause

Option A
- Benefit
- Cost
- Risk

Option B
- Benefit
- Cost
- Risk

Option C
- Benefit
- Cost
- Risk

Assumptions

Leader Decision
```

The system should provide options and evidence.

The Leader makes the final decision.

---

# 39. Success Criteria

LeaderOS succeeds when:

```text
The Leader opens it every working day.

The Leader understands project status within 30 seconds.

A note/task can be captured in less than 15 seconds.

Weekly review does not require reconstructing history manually.

Important follow-ups are not forgotten.

Lessons are searchable and reusable.

Historical project data becomes useful for future decisions.
```

---

# 40. Final Product Direction

```text
                         LEADER
                            │
                            ▼
                        LeaderOS
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       MY WORK           PROJECTS          PEOPLE
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                         HISTORY
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
      NOTES              INCIDENTS           RISKS
        │                   │                   │
      LESSONS            DECISIONS          WEEKLY
        └───────────────────┼───────────────────┘
                            │
                         ANALYTICS
                            │
                     DECISION SUPPORT
                            │
                            ▼
                      LEADER DECIDES
```

Core philosophy:

> **Capture → Organize → Execute → Track → Review → Learn → Analyze → Decide**
