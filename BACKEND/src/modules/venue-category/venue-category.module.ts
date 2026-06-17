import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenueCategoryService } from './venue-category.service';
import { VenueCategoryController } from './venue-category.controller';
import { ServiceCategory } from '../service-category/entity/service-category.entity';
import { Form } from '@modules/form/entity/form.entity';
import { FormModule } from '@modules/form/form.module';

@Module({
    imports: [
        // POST /venue-category writes to `categories` via ServiceCategory (same as service-category API).
        TypeOrmModule.forFeature([ServiceCategory, Form], 'mongo'),
        FormModule
    ],    controllers: [VenueCategoryController],
    providers: [VenueCategoryService],
    exports: [VenueCategoryService],
})
export class VenueCategoryModule {

}
