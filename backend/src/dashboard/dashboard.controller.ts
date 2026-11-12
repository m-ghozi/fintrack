import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { DashboardService, ChartPeriod } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(['7_days', 'this_month', '3_months', '6_months', '1_year'])
  period?: ChartPeriod;
}

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: AuthUser, @Query() query: DashboardQueryDto) {
    return this.dashboard.getDashboard(user.userId, query.period);
  }
}
