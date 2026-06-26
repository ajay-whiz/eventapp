import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/response/dashboard-stats.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get aggregated dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsResponseDto })
  async getStats(): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getStats();
  }
}
