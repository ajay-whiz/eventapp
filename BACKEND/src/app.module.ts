import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SupabaseModule } from '@shared/modules/supabase/supabase.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from '@core/config/configuration';
import { buildMongoTypeOrmOptions } from '@core/config/mongo.config';
import { RequestContextMiddleware } from '@common/middlewares/request-context/request-context.middleware';
import { LoggerModule } from '@core/logger/logger.module'; 
import { EmailModule } from '@shared/email/email.module';
import { HandlebarsService } from '@common/helper/handlebar';
import { PdfModule } from '@shared/modules/pdf/pdf.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { EventModule } from '@modules/event/event.module';
import { AdminModule } from '@modules/admin/admin.module';
import { FeatureModule } from './modules/feature/feature.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from '@modules/role/role.module';
import { FieldModule } from '@modules/field/field.module';
import { FormModule } from '@modules/form/form.module';
import { ServiceCategoryModule } from '@modules/service-category/service-category.module';
import { VenueModule } from '@modules/venue/venue.module';
import { VendorModule } from '@modules/vendor/vendor.module';
import { EnterpriseModule } from '@modules/enterprise/enterprise.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { VenueCategoryModule } from '@modules/venue-category/venue-category.module';
import { ContentPolicyModule } from '@modules/content-policy/content-policy.module';
import { VenueBookingModule } from '@modules/venue-booking/venue-booking.module';
import { BookingModule } from '@modules/booking/booking.module';
import { VendorCategoryModule } from '@modules/vendor-category/vendor-category.module';
import { FaqModule } from '@modules/faq/faq.module';
import { ProfileModule } from '@modules/profile/profile.module';
import { OfferModule } from '@modules/offer/offer.module';
import { FeedbackModule } from '@modules/feedback/feedback.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { LocationModule } from '@modules/location/location.module';
import { BannerModule } from '@modules/banner/banner.module';
import { TestimonialModule } from '@modules/testimonial/testimonial.module';
import { RatingModule } from './modules/rating/rating.module';
import { QuotationRequestModule } from './modules/quotation-request/quotation-request.module';
import { MealTypeModule } from './modules/meal-type/meal-type.module';
import { CuisineModule } from './modules/cuisine/cuisine.module';
import { ServingStyleModule } from './modules/serving-style/serving-style.module';
import { AdditionalServiceModule } from './modules/additional-service/additional-service.module';
import { SimilarModule } from './modules/similar/similar.module';
import { ChatModule } from './modules/chat/chat.module';
import { ServiceCategoryFormInputsModule } from './modules/service-category-form-inputs/service-category-form-inputs.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { FileUploadModule } from '@shared/modules/file-upload/file-upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      ignoreEnvFile: false,
      envFilePath: ['.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      name: 'mongo',
      useFactory: (config: ConfigService) =>
        buildMongoTypeOrmOptions(config, __dirname),
      inject: [ConfigService],
    }),
    LoggerModule,
    EmailModule,
    PdfModule,
    AuthModule,
    UserModule,
    EventModule,    
    AdminModule,  
    FeatureModule,
    RoleModule,
    FieldModule,
    FormModule,
    ServiceCategoryModule,
    ServiceCategoryFormInputsModule,
    SimilarModule,
    VenueModule,
    VendorModule,
    EnterpriseModule,
    VenueCategoryModule,
    ContentPolicyModule,
    VenueBookingModule,
    BookingModule,
    VendorCategoryModule,
    FaqModule,
    ProfileModule,
    OfferModule,
    FeedbackModule,
    NotificationModule,
    BannerModule,
    TestimonialModule,
    LocationModule,
    RatingModule,
    QuotationRequestModule,
    MealTypeModule,
    CuisineModule,
    ServingStyleModule,
    AdditionalServiceModule,
    SupabaseModule,
    FileUploadModule,
    ChatModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    HandlebarsService,
    AppService,
  ],
  exports:[],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
  
}