import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { NotesModule } from './modules/notes/notes.module';
import { TodayModule } from './modules/today/today.module';
import { LessonsLearnedModule } from './modules/lessons-learned/lessons-learned.module';
import { LearningItemsModule } from './modules/learning-items/learning-items.module';
import { WeeklyPlansModule } from './modules/weekly-plans/weekly-plans.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RisksModule } from './modules/risks/risks.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { DecisionsModule } from './modules/decisions/decisions.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MembersModule,
    ProjectsModule,
    MilestonesModule,
    TasksModule,
    FollowUpsModule,
    NotesModule,
    TodayModule,
    LessonsLearnedModule,
    LearningItemsModule,
    WeeklyPlansModule,
    DashboardModule,
    RisksModule,
    IncidentsModule,
    DecisionsModule,
    MeetingsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
