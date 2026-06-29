import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Testimonial } from './entity/testimonial.entity';
import { CreateTestimonialDto } from './dto/request/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/request/update-testimonial.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class TestimonialService {
  constructor(
    @InjectRepository(Testimonial, 'mongo')
    private readonly repo: MongoRepository<Testimonial>,
  ) {}

  private getNotDeletedMatch() {
    return {
      $or: [
        { isDeleted: { $ne: true } },
        { isDeleted: { $exists: false } },
        { isDeleted: null },
      ],
    };
  }

  async create(dto: CreateTestimonialDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const matchStage: any = {
      $and: [this.getNotDeletedMatch()],
    };

    if (typeof isActive === 'boolean') {
      matchStage.$and.push({ isActive });
    }

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      const safe = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      matchStage.$and.push({
        $or: [
          { name: { $regex: regex } },
          { designation: { $regex: regex } },
          { message: { $regex: regex } },
        ],
      });
    }

    const allowedSortFields = ['createdAt', 'name', 'designation', 'rating'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const countPipeline = [{ $match: matchStage }];
    const dataPipeline = [
      { $match: matchStage },
      { $sort: { [sortField]: sortDirection } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [countResult, data] = await Promise.all([
      this.repo.aggregate([...countPipeline, { $count: 'total' }]).toArray(),
      this.repo.aggregate(dataPipeline).toArray(),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    return { data, total, page, limit };
  }

  async findActiveForMobile() {
    return this.repo.find({
      where: {
        isActive: true,
        isDeleted: false,
      } as any,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException('Testimonial not found');
    }

    const entity = await this.repo.findOne({
      where: {
        _id: new ObjectId(id),
        isDeleted: false,
      } as any,
    });

    if (!entity) throw new NotFoundException('Testimonial not found');
    return entity;
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException('Testimonial not found');
    }

    const result = await this.repo.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, isDeleted: true } },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Testimonial not found');
    }

    return { message: 'Testimonial deleted successfully' };
  }
}
