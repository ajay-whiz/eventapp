import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '@modules/user/entities/user.entity';
import { Vendor } from '@modules/vendor/entity/vendor.entity';
import { Venue } from '@modules/venue/entity/venue.entity';
import { Booking } from '@modules/booking/entities/booking.entity';
import { Event } from '@modules/event/entities/event.entity';
import { Rating } from '@modules/rating/entity/rating.entity';
import { Notification } from '@modules/notification/entity/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [User, Vendor, Venue, Booking, Event, Rating, Notification],
      'mongo',
    ),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
