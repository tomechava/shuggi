import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pack, PackDocument, PackStatus, DietaryTag } from './schemas/pack.schema';
import {
    CreatePackDto,
    UpdatePackDto,
    AdminUpdatePackDto,
    UpdatePackTimesDto,
    UpdatePackPriceDto,
    PackFiltersDto,
} from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PacksService {
    private readonly minDiscountPercentage: number;
    private readonly maxDiscountPercentage: number;
    private readonly platformCommissionRate: number;
    private readonly maxAdvanceDays: number;
    private readonly maxActivePacks: number;
    private readonly maxPacksPerDay: number;

    constructor(
        @InjectModel(Pack.name) private packModel: Model<PackDocument>,
        private configService: ConfigService,
    ) {
        // Load configuration from environment variables
        this.minDiscountPercentage = this.configService.get<number>('MIN_DISCOUNT_PERCENTAGE', 40);
        this.maxDiscountPercentage = this.configService.get<number>('MAX_DISCOUNT_PERCENTAGE', 80);
        this.platformCommissionRate = this.configService.get<number>('PLATFORM_COMMISSION_RATE', 0.10);
        this.maxAdvanceDays = this.configService.get<number>('MAX_ADVANCE_DAYS', 7);
        this.maxActivePacks = this.configService.get<number>('MAX_ACTIVE_PACKS', 14);
        this.maxPacksPerDay = this.configService.get<number>('MAX_PACKS_PER_DAY', 2);
    }

    /**
     * Calculate pricing fields automatically
     */
    private calculatePricing(originalPrice: number, discountedPrice: number) {
        const discountPercentage = Math.round(
            ((originalPrice - discountedPrice) / originalPrice) * 100
        );
        const platformCommission = Math.round(discountedPrice * this.platformCommissionRate);
        const storeEarnings = discountedPrice - platformCommission;

        return {
            discountPercentage,
            platformCommission,
            storeEarnings,
        };
    }

    /**
     * Validate discount percentage is within allowed range
     */
    private validateDiscount(originalPrice: number, discountedPrice: number): void {
        if (discountedPrice >= originalPrice) {
            throw new BadRequestException('Discounted price must be lower than original price');
        }

        const { discountPercentage } = this.calculatePricing(originalPrice, discountedPrice);

        if (discountPercentage < this.minDiscountPercentage) {
            throw new BadRequestException(
                `Discount must be at least ${this.minDiscountPercentage}%. Current: ${discountPercentage}%`
            );
        }

        if (discountPercentage > this.maxDiscountPercentage) {
            throw new BadRequestException(
                `Discount cannot exceed ${this.maxDiscountPercentage}%. Current: ${discountPercentage}%`
            );
        }
    }

    /**
 * Validate dietary tags consistency
 */
    private validateDietaryTags(dietaryInfo: { tags?: DietaryTag[]; allergens?: DietaryTag[] }): void {
        const tags = dietaryInfo.tags || [];
        const allergens = dietaryInfo.allergens || [];

        // Vegan cannot contain dairy, eggs, etc
        if (tags.includes(DietaryTag.VEGAN)) {
            const conflictingAllergens = [
                DietaryTag.CONTAINS_DAIRY,
                DietaryTag.CONTAINS_EGGS,
            ];

            const hasConflict = allergens.some(a => conflictingAllergens.includes(a));
            if (hasConflict) {
                throw new BadRequestException('Vegan packs cannot contain dairy or eggs');
            }

            // Auto-add vegetarian if vegan
            if (!tags.includes(DietaryTag.VEGETARIAN)) {
                tags.push(DietaryTag.VEGETARIAN);
            }
        }

        // Dairy-free cannot contain dairy
        if (tags.includes(DietaryTag.DAIRY_FREE) && allergens.includes(DietaryTag.CONTAINS_DAIRY)) {
            throw new BadRequestException('Dairy-free packs cannot contain dairy');
        }
    }

    /**
     * Validate pack date is within allowed range
     */
    private validatePackDate(availableDate: Date): void {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0); // Start of today

        const packDate = new Date(availableDate);
        packDate.setUTCHours(0, 0, 0, 0);

        // Cannot create pack for past dates
        if (packDate < now) {
            throw new BadRequestException('Cannot create pack for past dates');
        }

        // Cannot create pack more than maxAdvanceDays in advance
        const maxDate = new Date(now);
        maxDate.setDate(maxDate.getDate() + this.maxAdvanceDays);

        if (packDate > maxDate) {
            throw new BadRequestException(
                `Cannot create pack more than ${this.maxAdvanceDays} days in advance`
            );
        }
    }

    /**
     * STORE: Create a new pack
     */
    async create(createPackDto: CreatePackDto, storeId: string): Promise<Pack> {
        // Validate discount range
        this.validateDiscount(createPackDto.originalPrice, createPackDto.discountedPrice);

        // Validate pack date
        this.validatePackDate(createPackDto.availableDate);

        // Validate dietary tags if provided
        if (createPackDto.dietaryInfo) {
            this.validateDietaryTags(createPackDto.dietaryInfo);
        }

        // Check store doesn't exceed maxPacksPerDay for this date
        const packDate = new Date(createPackDto.availableDate);
        packDate.setHours(0, 0, 0, 0);

        const packsOnDate = await this.packModel.countDocuments({
            store: new Types.ObjectId(storeId),
            availableDate: packDate,
            status: { $in: [PackStatus.DRAFT, PackStatus.AVAILABLE] }
        });

        if (packsOnDate >= this.maxPacksPerDay) {
            throw new BadRequestException(
                `Cannot create more than ${this.maxPacksPerDay} packs for the same date`
            );
        }

        // Check store doesn't exceed maxActivePacks total
        const activePacks = await this.packModel.countDocuments({
            store: new Types.ObjectId(storeId),
            status: { $in: [PackStatus.DRAFT, PackStatus.AVAILABLE] }
        });

        if (activePacks >= this.maxActivePacks) {
            throw new BadRequestException(
                `Cannot have more than ${this.maxActivePacks} active packs simultaneously`
            );
        }

        // Calculate pricing
        const pricing = this.calculatePricing(
            createPackDto.originalPrice,
            createPackDto.discountedPrice
        );

        // Normalize availableDate to midnight UTC
        const normalizedDate = new Date(createPackDto.availableDate);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Create pack
        const pack = new this.packModel({
            store: new Types.ObjectId(storeId),
            name: createPackDto.name,
            description: createPackDto.description,
            availableDate: normalizedDate,
            pickupTimeStart: createPackDto.pickupTimeStart,
            pickupTimeEnd: createPackDto.pickupTimeEnd,
            quantity: createPackDto.quantity,
            quantityReserved: 0,
            originalPrice: createPackDto.originalPrice,
            discountedPrice: createPackDto.discountedPrice,
            discountPercentage: pricing.discountPercentage,
            platformCommissionRate: this.platformCommissionRate,
            platformCommission: pricing.platformCommission,
            storeEarnings: pricing.storeEarnings,
            dietaryInfo: {
                tags: createPackDto.dietaryInfo?.tags || [],
                allergens: createPackDto.dietaryInfo?.allergens || [],
                notes: createPackDto.dietaryInfo?.notes || ''
            },
            image: createPackDto.image,
            status: PackStatus.AVAILABLE,
        });

        return pack.save();
    }

    /**
     * PUBLIC: Find all available packs
     */
    async findAll(): Promise<Pack[]> {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0); // ← Cambiar a setUTCHours

        return this.packModel
            .find({
                status: PackStatus.AVAILABLE,
                availableDate: { $gte: now }
            })
            .populate('store', 'name address location logo')
            .sort({ availableDate: 1, pickupTimeStart: 1 })
            .exec();
    }

    /**
     * PUBLIC: Find pack by ID
     */
    async findById(id: string): Promise<Pack> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid pack ID');
        }

        const pack = await this.packModel
            .findOne({
                _id: id,
                status: PackStatus.AVAILABLE
            })
            .populate('store', 'name address location contact businessHours logo')
            .exec();

        if (!pack) {
            throw new NotFoundException('Pack not found');
        }

        return pack;
    }

    /**
     * STORE: Find all packs for my store
     */
    async findByStore(storeId: string): Promise<Pack[]> {
        if (!Types.ObjectId.isValid(storeId)) {
            throw new BadRequestException('Invalid store ID');
        }

        return this.packModel
            .find({ store: new Types.ObjectId(storeId) })
            .sort({ availableDate: 1, pickupTimeStart: 1 })
            .exec();
    }

    /**
     * PUBLIC: Find packs with filters
     */
    async findWithFilters(filters: PackFiltersDto): Promise<Pack[]> {
        const query: any = {
            status: PackStatus.AVAILABLE,
            availableDate: { $gte: new Date() }
        };

        // Filter by store
        if (filters.storeId) {
            if (!Types.ObjectId.isValid(filters.storeId)) {
                throw new BadRequestException('Invalid store ID');
            }
            query.store = new Types.ObjectId(filters.storeId);
        }

        // Filter by date
        if (filters.availableDate) {
            const date = new Date(filters.availableDate);
            date.setUTCHours(0, 0, 0, 0);
            query.availableDate = date;
        }

        // Filter by max price
        if (filters.maxPrice) {
            query.discountedPrice = { $lte: filters.maxPrice };
        }

        // Filter by minimum discount
        if (filters.minDiscount) {
            query.discountPercentage = { $gte: filters.minDiscount };
        }

        // Filter by dietary tags
        if (filters.dietaryTags && filters.dietaryTags.length > 0) {
            query['dietaryInfo.tags'] = { $all: filters.dietaryTags };
        }

        return this.packModel
            .find(query)
            .populate('store', 'name address location logo')
            .sort({ availableDate: 1, pickupTimeStart: 1 })
            .exec();
    }

    /**
     * PUBLIC: Find nearby packs (geolocation)
     */
    async findNearby(
        lat: number,
        lng: number,
        radius: number = 5,
        filters?: PackFiltersDto
    ): Promise<Pack[]> {
        // First, find nearby stores
        const Store = this.packModel.db.model('Store');
        const nearbyStores = await Store.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: radius * 1000 // Convert km to meters
                }
            },
            isActive: true
        }).select('_id');

        const storeIds = nearbyStores.map(s => s._id);

        if (storeIds.length === 0) {
            return [];
        }

        // Build query
        const query: any = {
            store: { $in: storeIds },
            status: PackStatus.AVAILABLE,
            availableDate: { $gte: new Date() }
        };

        // Apply additional filters if provided
        if (filters) {
            if (filters.maxPrice) {
                query.discountedPrice = { $lte: filters.maxPrice };
            }
            if (filters.minDiscount) {
                query.discountPercentage = { $gte: filters.minDiscount };
            }
            if (filters.dietaryTags && filters.dietaryTags.length > 0) {
                query['dietaryInfo.tags'] = { $all: filters.dietaryTags };
            }
        }

        return this.packModel
            .find(query)
            .populate('store', 'name address location logo')
            .sort({ availableDate: 1, pickupTimeStart: 1 })
            .limit(20)
            .exec();
    }

    /**
     * STORE: Update pack (limited fields)
     */
    async updateByStore(id: string, storeId: string, updatePackDto: UpdatePackDto): Promise<PackDocument> {
        const pack = await this.packModel.findOne({
            _id: id,
            store: new Types.ObjectId(storeId)
        });

        if (!pack) {
            throw new NotFoundException('Pack not found or you do not own this pack');
        }

        // Check if pack is expired or cancelled
        if (pack.status === PackStatus.EXPIRED || pack.status === PackStatus.CANCELLED) {
            throw new BadRequestException('Cannot update expired or cancelled packs');
        }

        // Update description
        if (updatePackDto.description !== undefined) {
            pack.description = updatePackDto.description;
        }

        // Update quantity (with validation)
        if (updatePackDto.quantity !== undefined) {
            if (updatePackDto.quantity < pack.quantityReserved) {
                throw new BadRequestException(
                    `Cannot reduce quantity below ${pack.quantityReserved} (already reserved)`
                );
            }
            pack.quantity = updatePackDto.quantity;
        }

        // Update dietary info
        if (updatePackDto.dietaryInfo !== undefined) {
            this.validateDietaryTags(updatePackDto.dietaryInfo);
            pack.dietaryInfo = {
                tags: updatePackDto.dietaryInfo.tags || [],
                allergens: updatePackDto.dietaryInfo.allergens || [],
                notes: updatePackDto.dietaryInfo.notes || ''
            };
        }

        // Update image
        if (updatePackDto.image !== undefined) {
            pack.image = updatePackDto.image;
        }

        return pack.save();
    }

    /**
     * STORE: Update pack times (special validation - 24h rule)
     */
    async updatePackTimes(
        id: string,
        storeId: string,
        updateTimesDto: UpdatePackTimesDto
    ): Promise<PackDocument> {
        const pack = await this.packModel.findOne({
            _id: id,
            store: new Types.ObjectId(storeId)
        });

        if (!pack) {
            throw new NotFoundException('Pack not found or you do not own this pack');
        }

        // If there are reservations, check 24h rule
        if (pack.quantityReserved > 0) {
            const packDateTime = new Date(pack.availableDate);
            const [hours, minutes] = pack.pickupTimeStart.split(':');
            packDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const now = new Date();
            const hoursUntilPickup = (packDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilPickup < 24) {
                throw new ForbiddenException(
                    'Cannot change pickup times less than 24 hours before pickup when there are active reservations'
                );
            }

            // TODO: Send notification to users with reservations
            // await this.notificationsService.notifyPickupTimeChange(pack);
        }

        // Update times
        if (updateTimesDto.availableDate) {
            this.validatePackDate(updateTimesDto.availableDate);
            pack.availableDate = updateTimesDto.availableDate;
        }

        if (updateTimesDto.pickupTimeStart) {
            pack.pickupTimeStart = updateTimesDto.pickupTimeStart;
        }

        if (updateTimesDto.pickupTimeEnd) {
            pack.pickupTimeEnd = updateTimesDto.pickupTimeEnd;
        }

        return pack.save();
    }

    /**
     * STORE: Update pack price (only if no reservations)
     */
    async updatePackPrice(
        id: string,
        storeId: string,
        updatePriceDto: UpdatePackPriceDto
    ): Promise<PackDocument> {
        const pack = await this.packModel.findOne({
            _id: id,
            store: new Types.ObjectId(storeId)
        });

        if (!pack) {
            throw new NotFoundException('Pack not found or you do not own this pack');
        }

        // Cannot change price if there are reservations
        if (pack.quantityReserved > 0) {
            throw new ForbiddenException('Cannot change price when there are active reservations');
        }

        // Validate new discount
        this.validateDiscount(updatePriceDto.originalPrice, updatePriceDto.discountedPrice);

        // Calculate new pricing
        const pricing = this.calculatePricing(
            updatePriceDto.originalPrice,
            updatePriceDto.discountedPrice
        );

        // Update pack
        pack.originalPrice = updatePriceDto.originalPrice;
        pack.discountedPrice = updatePriceDto.discountedPrice;
        pack.discountPercentage = pricing.discountPercentage;
        pack.platformCommission = pricing.platformCommission;
        pack.storeEarnings = pricing.storeEarnings;

        return pack.save();
    }

    /**
     * STORE: Change pack status (DRAFT <-> AVAILABLE, CANCELLED)
     */
    async changeStatus(id: string, storeId: string, newStatus: PackStatus): Promise<PackDocument> {
        const pack = await this.packModel.findOne({
            _id: id,
            store: new Types.ObjectId(storeId)
        });

        if (!pack) {
            throw new NotFoundException('Pack not found or you do not own this pack');
        }

        // Validate status transitions
        if (newStatus === PackStatus.CANCELLED && pack.quantityReserved > 0) {
            // TODO: Handle refunds for cancelled packs with reservations
            throw new ForbiddenException(
                'Cannot cancel pack with active reservations. Refunds must be processed first.'
            );
        }

        if (newStatus === PackStatus.SOLD_OUT || newStatus === PackStatus.EXPIRED) {
            throw new BadRequestException('These statuses are set automatically by the system');
        }

        pack.status = newStatus;
        return pack.save();
    }

    /**
     * STORE: Delete pack (only if no reservations)
     */
    async delete(id: string, storeId: string): Promise<void> {
        const pack = await this.packModel.findOne({
            _id: id,
            store: new Types.ObjectId(storeId)
        });

        if (!pack) {
            throw new NotFoundException('Pack not found or you do not own this pack');
        }

        if (pack.quantityReserved > 0) {
            throw new ForbiddenException('Cannot delete pack with active reservations');
        }

        await pack.deleteOne();
    }

    /**
     * ADMIN: Find all packs (including expired/cancelled)
     */
    async findAllAdmin(): Promise<Pack[]> {
        return this.packModel
            .find()
            .populate('store', 'name owner')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * ADMIN: Update pack (full access)
     */
    async updateByAdmin(id: string, adminUpdateDto: AdminUpdatePackDto): Promise<Pack> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid pack ID');
        }

        const updateData: any = {};

        // Update basic fields
        if (adminUpdateDto.name) updateData.name = adminUpdateDto.name;
        if (adminUpdateDto.description !== undefined) updateData.description = adminUpdateDto.description;
        if (adminUpdateDto.status) updateData.status = adminUpdateDto.status;
        if (adminUpdateDto.image !== undefined) updateData.image = adminUpdateDto.image;

        // Update dates/times
        if (adminUpdateDto.availableDate) updateData.availableDate = adminUpdateDto.availableDate;
        if (adminUpdateDto.pickupTimeStart) updateData.pickupTimeStart = adminUpdateDto.pickupTimeStart;
        if (adminUpdateDto.pickupTimeEnd) updateData.pickupTimeEnd = adminUpdateDto.pickupTimeEnd;

        // Update quantity
        if (adminUpdateDto.quantity) updateData.quantity = adminUpdateDto.quantity;

        // Update pricing
        if (adminUpdateDto.originalPrice !== undefined || adminUpdateDto.discountedPrice !== undefined) {
            const pack = await this.packModel.findById(id);
            if (!pack) {
                throw new NotFoundException('Pack not found');
            }

            const originalPrice = adminUpdateDto.originalPrice ?? pack.originalPrice;
            const discountedPrice = adminUpdateDto.discountedPrice ?? pack.discountedPrice;

            const pricing = this.calculatePricing(originalPrice, discountedPrice);

            updateData.originalPrice = originalPrice;
            updateData.discountedPrice = discountedPrice;
            updateData.discountPercentage = pricing.discountPercentage;
            updateData.platformCommission = pricing.platformCommission;
            updateData.storeEarnings = pricing.storeEarnings;
        }

        // Update dietary info
        if (adminUpdateDto.dietaryInfo) updateData.dietaryInfo = adminUpdateDto.dietaryInfo;

        const updatedPack = await this.packModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('store', 'name owner')
            .exec();

        if (!updatedPack) {
            throw new NotFoundException('Pack not found');
        }

        return updatedPack;
    }

    /**
     * SYSTEM: Cleanup expired packs (cron job)
     */
    async cleanupExpiredPacks(): Promise<number> {
        const now = new Date();

        const result = await this.packModel.updateMany(
            {
                status: { $in: [PackStatus.AVAILABLE, PackStatus.SOLD_OUT] },
                availableDate: { $lt: now }
            },
            {
                $set: { status: PackStatus.EXPIRED }
            }
        );

        return result.modifiedCount;
    }

    /**
     * SYSTEM: Update SOLD_OUT status based on quantity
     */
    async updateSoldOutStatus(packId: string): Promise<void> {
        const pack = await this.packModel.findById(packId);

        if (!pack) return;

        const quantityAvailable = pack.quantity - pack.quantityReserved;

        if (quantityAvailable === 0 && pack.status === PackStatus.AVAILABLE) {
            pack.status = PackStatus.SOLD_OUT;
            await pack.save();
        } else if (quantityAvailable > 0 && pack.status === PackStatus.SOLD_OUT) {
            pack.status = PackStatus.AVAILABLE;
            await pack.save();
        }
    }
}