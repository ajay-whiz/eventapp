import { BadRequestException, Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MongoRepository } from 'typeorm';
import { ServiceCategory } from '../service-category/entity/service-category.entity';
import { CreateVenueCategoryDto } from './dto/request/create-venue-category.dto';
import { UpdateVenueCategoryDto } from './dto/request/update-venue-category.dto';
import { VenueCategoryResponseDto } from './dto/response/venue-category.dto';
import { FormResponseDto } from '@modules/form/dto/response/form.dto';
import { plainToInstance } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { IPagination } from '@common/interfaces/pagination.interface';
import { IPaginationMeta } from '@common/interfaces/paginationMeta.interface';
import { Form } from '@modules/form/entity/form.entity';

@Injectable()
export class VenueCategoryService implements OnModuleInit {
  private readonly logger = new Logger(VenueCategoryService.name);

  constructor(
    @InjectRepository(ServiceCategory, 'mongo')
    private readonly categoryRepo: MongoRepository<ServiceCategory>,
    @InjectRepository(Form, 'mongo')
    private readonly formRepo: MongoRepository<Form>,
    @InjectDataSource('mongo')
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.migrateLegacyVenueCategories();
  }

  /** Copy records from legacy `venue_categories` into shared `categories` collection. */
  private async migrateLegacyVenueCategories(): Promise<void> {
    try {
      const driverOptions = this.dataSource.options as {
        host?: string;
        port?: number;
        database?: string;
      };
      const host = driverOptions.host || 'localhost';
      const port = driverOptions.port || 27017;
      const database = driverOptions.database || 'event_booking';

      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(`mongodb://${host}:${port}`);
      await client.connect();
      const legacyRecords = await client
        .db(database)
        .collection('venue_categories')
        .find({ isDeleted: { $ne: true } })
        .toArray();
      await client.close();

      let migrated = 0;
      for (const legacy of legacyRecords) {
        const existing = await this.categoryRepo.findOneBy({ _id: legacy._id });
        if (existing) {
          continue;
        }

        try {
          await this.validateVenueCategoryForm(String(legacy.formId));
        } catch {
          continue;
        }

        const category = this.categoryRepo.create({
          name: legacy.name,
          description: legacy.description,
          formId: String(legacy.formId),
          isActive: legacy.isActive ?? true,
          isDeleted: false,
          key: legacy.key,
          createdBy: legacy.createdBy || 'migration',
          updatedBy: legacy.updatedBy || 'migration',
          createdAt: legacy.createdAt,
          updatedAt: legacy.updatedAt,
        });
        category.id = legacy._id;
        await this.categoryRepo.save(category);
        migrated++;
      }

      if (migrated > 0) {
        this.logger.log(`Migrated ${migrated} venue category record(s) from venue_categories to categories`);
      }
    } catch (error) {
      this.logger.warn(`Legacy venue category migration skipped: ${error?.message || error}`);
    }
  }

  private buildFormIdObjectIdStage() {
    return {
      $addFields: {
        formIdObj: {
          $cond: {
            if: {
              $and: [
                { $ne: ['$formId', null] },
                { $ne: ['$formId', ''] },
                { $ne: ['$formId', undefined] },
              ],
            },
            then: {
              $cond: {
                if: { $eq: [{ $type: '$formId' }, 'objectId'] },
                then: '$formId',
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: [{ $type: '$formId' }, 'string'] },
                        { $eq: [{ $strLenCP: '$formId' }, 24] },
                      ],
                    },
                    then: { $toObjectId: '$formId' },
                    else: null,
                  },
                },
              },
            },
            else: null,
          },
        },
      },
    };
  }

  private async validateVenueCategoryForm(formId?: string): Promise<void> {
    if (!formId || formId.trim() === '') {
      throw new BadRequestException('formId is required for venue categories');
    }
    if (!ObjectId.isValid(formId)) {
      throw new BadRequestException(`Invalid formId format: ${formId}`);
    }
    const form = await this.formRepo.findOneBy({ _id: new ObjectId(formId) });
    if (!form) {
      throw new NotFoundException(`Form with ID ${formId} not found`);
    }
    if (form.type !== 'venue-category') {
      throw new BadRequestException(
        `Form must have type 'venue-category'. Found '${form.type}'`,
      );
    }
  }

  async create(dto: CreateVenueCategoryDto): Promise<VenueCategoryResponseDto> {
    await this.validateVenueCategoryForm(dto.formId);

    const venueCategory = this.categoryRepo.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      formId: String(dto.formId).trim(),
      isActive: dto.isActive ?? true,
      isDeleted: false,
    });

    const savedVenueCategory = await this.categoryRepo.save(venueCategory);

    this.logger.log(
      `Created venue category "${savedVenueCategory.name}" in categories (id: ${savedVenueCategory.id})`,
    );

    return plainToInstance(VenueCategoryResponseDto, savedVenueCategory, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
  ): Promise<IPagination<VenueCategoryResponseDto>> {
    const skip = (page - 1) * limit;

    // Query from 'categories' collection (ServiceCategory) and filter by form type 'venue-category'
    // This is the same approach as service-category which filters by 'vendor-service'
    const pipeline: any[] = [
      // Match categories (optionally filter by search)
      {
        $match: {
          isDeleted: { $ne: true },
          ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
        },
      },
      this.buildFormIdObjectIdStage(),
      {
        $match: {
          formIdObj: { $ne: null },
        },
      },
      // Join with forms collection
      {
        $lookup: {
          from: 'forms',
          localField: 'formIdObj',
          foreignField: '_id',
          as: 'formData',
        },
      },
      // Unwind form data (only keep categories that have a form)
      {
        $unwind: {
          path: '$formData',
          preserveNullAndEmptyArrays: false,
        },
      },
      // Filter to only include categories with forms of type 'venue-category'
      {
        $match: {
          'formData.type': 'venue-category',
          'formData.isDeleted': { $ne: true },
        },
      },
      // Sort by createdAt descending (similar to service-category)
      {
        $sort: { createdAt: -1 }
      }
    ];

    // Get total count (before pagination)
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.categoryRepo.aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push(
      { $skip: skip },
      { $limit: limit }
    );

    // Execute aggregation on 'categories' collection (ServiceCategory)
    const venueCategoriesWithForms = await this.categoryRepo.aggregate(pipeline).toArray();

    // Process and transform results
    const processedCategories = venueCategoriesWithForms.map((category: any) => {
      // Convert _id to id string and prepare response
      return {
        id: category._id.toString(),
        key: category.key,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        formId: category.formId,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      };
    });

    // Transform to response DTO
    const data = plainToInstance(VenueCategoryResponseDto, processedCategories, {
      excludeExtraneousValues: true,
    });
    const pagination: IPaginationMeta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    return {
      data,
      pagination,
    };
  }

  async findOne(id: string): Promise<VenueCategoryResponseDto> {
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid venue category id format: ${id}`);
    }

    // Use aggregation to join category with forms and filter by form type 'venue-category'
    const results = await this.categoryRepo
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        this.buildFormIdObjectIdStage(),
        {
          $match: {
            formIdObj: { $ne: null },
          },
        },
        {
          $lookup: {
            from: 'forms',
            localField: 'formIdObj',
            foreignField: '_id',
            as: 'formData',
          },
        },
        { 
          $unwind: { 
            path: '$formData', 
            preserveNullAndEmptyArrays: false 
          } 
        },
        // Filter to only include categories with forms of type 'venue-category'
        {
          $match: {
            'formData.type': 'venue-category',
            'formData.isDeleted': { $ne: true },
          }
        },
        { 
          $addFields: { 
            id: { $toString: '$_id' } 
          } 
        },
        { 
          $project: { 
            _id: 0, 
            id: 1, 
            key: 1,
            name: 1, 
            formId: 1, 
            description: 1, 
            icon: 1,
            color: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            formData: 1  // Include full form data
          } 
        },
      ])
      .toArray();

    if (!results.length) {
      // Check if category exists but form type is wrong
      const category = await this.categoryRepo.findOneBy({ _id: new ObjectId(id) });
      if (!category || category.isDeleted) {
        throw new NotFoundException('Venue Category not found');
      }
      
      if (!category.formId || category.formId.trim() === '') {
        throw new NotFoundException('Venue Category does not have a valid formId');
      }

      // Check if form exists but has wrong type
      if (ObjectId.isValid(category.formId)) {
        const form = await this.formRepo.findOneBy({ _id: new ObjectId(category.formId) });
        if (!form) {
          throw new NotFoundException(`Form with ID ${category.formId} not found in forms table`);
        }
        if (form.type !== 'venue-category') {
          throw new NotFoundException(`Venue Category is linked to a form with type '${form.type}'. Only categories with forms of type 'venue-category' are allowed.`);
        }
      }
      
      throw new NotFoundException('Venue Category not found or does not have a valid venue-category form');
    }

    const categoryResult = results[0];
    let form = categoryResult.formData;

    // Process form fields to add actualValue (similar to service-category)
    if (form && form.fields && Array.isArray(form.fields)) {
      form.fields = form.fields.map((field: any) => {
        // Always ensure actualValue exists - initialize if missing
        const hasActualValue = field.hasOwnProperty('actualValue') && 
                              field.actualValue !== null && 
                              field.actualValue !== undefined;
        
        // Initialize or preserve actualValue
        if (!hasActualValue) {
          // For MultiImageUpload, initialize as empty array
          if (field.type === 'MultiImageUpload') {
            field.actualValue = [];
          } else {
            // For other fields, use defaultValue from metadata or empty string
            field.actualValue = field.metadata?.defaultValue || '';
          }
        } else {
          // actualValue exists in database - preserve it exactly as stored
          if (field.type === 'MultiImageUpload') {
            // If it's already an array, keep it as is
            if (Array.isArray(field.actualValue)) {
              // Keep the array structure - it may contain objects with url.imageUrl
            } else if (typeof field.actualValue === 'string') {
              // If it's a string, try to parse it as JSON
              try {
                field.actualValue = JSON.parse(field.actualValue);
              } catch {
                // If parsing fails, wrap in array
                field.actualValue = field.actualValue ? [field.actualValue] : [];
              }
            } else if (field.actualValue === null || field.actualValue === undefined) {
              // If it's null or undefined, convert to empty array
              field.actualValue = [];
            }
          }
        }
        
        // Ensure actualValue is always present in the response
        if (!field.hasOwnProperty('actualValue')) {
          field.actualValue = field.type === 'MultiImageUpload' ? [] : '';
        }
        
        return field;
      });
    }

    // Transform form to DTO format
    let transformedForm = null;
    if (form) {
      transformedForm = plainToInstance(FormResponseDto, form, { excludeExtraneousValues: true });
      // After transformation, ensure actualValue is still present in fields
      if (transformedForm && transformedForm.fields && Array.isArray(transformedForm.fields)) {
        transformedForm.fields = transformedForm.fields.map((field: any, index: number) => {
          // Get the original field to preserve actualValue
          const originalField = form.fields[index] as any;
          if (originalField && originalField.hasOwnProperty('actualValue')) {
            field.actualValue = originalField.actualValue;
          } else if (!field.hasOwnProperty('actualValue')) {
            // If actualValue is missing, initialize it
            field.actualValue = field.type === 'MultiImageUpload' ? [] : '';
          }
          return field;
        });
      }
    }

    // Prepare response with form data
    const responseData = {
      id: categoryResult.id,
      key: categoryResult.key,
      name: categoryResult.name,
      description: categoryResult.description,
      icon: categoryResult.icon,
      color: categoryResult.color,
      formId: categoryResult.formId,
      isActive: categoryResult.isActive,
      createdAt: categoryResult.createdAt,
      updatedAt: categoryResult.updatedAt,
      form: transformedForm
    };

    return plainToInstance(VenueCategoryResponseDto, responseData);
  }

  async update(
    id: string,
    dto: UpdateVenueCategoryDto,
  ): Promise<VenueCategoryResponseDto> {
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid venue category id format: ${id}`);
    }

    const venueCategory = await this.categoryRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false },
    });
    if (!venueCategory) {
      throw new NotFoundException(`Venue category not found with id: ${id}`);
    }
    if (dto.formId) {
      await this.validateVenueCategoryForm(dto.formId);
    }
    Object.assign(venueCategory, dto);
    const savedVenueCategory = await this.categoryRepo.save(venueCategory);
    return plainToInstance(VenueCategoryResponseDto, savedVenueCategory, {
      excludeExtraneousValues: true,
    });
  }

  async delete(id: string): Promise<{ message: string }> {
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid venue category id format: ${id}`);
    }

    const result = await this.categoryRepo.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, isDeleted: true, updatedAt: new Date()} },
    );
    if (result.modifiedCount === 0) {
      throw new NotFoundException(`Venue category not found with id: ${id}`);
    }
    return { message: 'Venue category deleted successfully' };
  }

  async updateStatus(id: string, isActive: boolean): Promise<{ message: string }> {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid venue category id format: ${id}`);
    }
    const result = await this.categoryRepo.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive, updatedAt: new Date() } },
    );
    if (result.modifiedCount === 0) {
      throw new NotFoundException(`Venue category not found with id: ${id}`);
    }
    return { message: 'Venue category status updated successfully' };
  }
}
