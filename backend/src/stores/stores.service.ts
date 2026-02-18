import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
import { CreateStoreDto, UpdateStoreDto, AdminUpdateStoreDto } from './dto';

@Injectable()
export class StoresService {
    constructor(
        @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    ) { }

    /**
     * ADMIN: Create a new store
     */
    async create(createStoreDto: CreateStoreDto): Promise<Store> {
        // Verify owner exists and has STORE role (we'll add this validation later with UsersService)

        // Transform coordinates from { lat, lng } to GeoJSON format [lng, lat]
        const geoJsonLocation = {
            type: 'Point' as const,
            coordinates: [
                createStoreDto.coordinates.lng,
                createStoreDto.coordinates.lat
            ]
        };

        const storeData = {
            name: createStoreDto.name,
            description: createStoreDto.description || '',
            owner: new Types.ObjectId(createStoreDto.ownerId),
            location: geoJsonLocation,
            address: createStoreDto.address,
            contact: createStoreDto.contact,
            businessHours: createStoreDto.businessHours,
            logo: createStoreDto.logo,
            isActive: true
        };

        const createdStore = new this.storeModel(storeData);
        return createdStore.save();
    }

    /**
     * PUBLIC: Find all active stores
     */
    async findAll(): Promise<Store[]> {
        return this.storeModel
            .find({ isActive: true })
            .populate('owner', 'name email') // Populate owner info (name and email only)
            .exec();
    }

    /**
     * ADMIN: Find all stores (including inactive)
     */
    async findAllAdmin(): Promise<Store[]> {
        return this.storeModel
            .find()
            .populate('owner', 'name email role')
            .exec();
    }

    /**
     * PUBLIC: Find store by ID (only if active)
     */
    async findById(id: string): Promise<Store> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid store ID');
        }

        const store = await this.storeModel
            .findOne({ _id: id, isActive: true })
            .populate('owner', 'name email')
            .exec();

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        return store;
    }

    /**
     * ADMIN: Find store by ID (even if inactive)
     */
    async findByIdAdmin(id: string): Promise<Store> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid store ID');
        }

        const store = await this.storeModel
            .findById(id)
            .populate('owner', 'name email role')
            .exec();

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        return store;
    }

    /**
     * STORE OWNER: Find their own store
     */
    async findByOwner(userId: string): Promise<StoreDocument> {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid user ID');
        }

        const store = await this.storeModel
            .findOne({ owner: new Types.ObjectId(userId) })
            .exec();

        if (!store) {
            throw new NotFoundException('You do not own any store');
        }

        return store;
    }

    /**
     * STORE OWNER: Update limited fields (description, contact)
     */
    async updateByOwner(userId: string, updateStoreDto: UpdateStoreDto): Promise<StoreDocument> {
        const store = await this.findByOwner(userId);

        // Only update allowed fields
        if (updateStoreDto.description !== undefined) {
            store.description = updateStoreDto.description;
        }
        if (updateStoreDto.contactEmail !== undefined) {
            store.contact.email = updateStoreDto.contactEmail;
        }
        if (updateStoreDto.contactPhone !== undefined) {
            store.contact.phone = updateStoreDto.contactPhone;
        }

        return store.save();
    }

    /**
     * ADMIN: Full update of store
     */
    async updateByAdmin(id: string, adminUpdateDto: AdminUpdateStoreDto): Promise<Store> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid store ID');
        }

        const updateData: any = {};

        // Update basic fields
        if (adminUpdateDto.name) updateData.name = adminUpdateDto.name;
        if (adminUpdateDto.description !== undefined) updateData.description = adminUpdateDto.description;
        if (adminUpdateDto.isActive !== undefined) updateData.isActive = adminUpdateDto.isActive;
        if (adminUpdateDto.logo !== undefined) updateData.logo = adminUpdateDto.logo;

        // Update owner
        if (adminUpdateDto.ownerId) {
            updateData.owner = new Types.ObjectId(adminUpdateDto.ownerId);
        }

        // Update location if coordinates provided
        if (adminUpdateDto.coordinates) {
            updateData.location = {
                type: 'Point',
                coordinates: [
                    adminUpdateDto.coordinates.lng,
                    adminUpdateDto.coordinates.lat
                ]
            };
        }

        // Update nested objects
        if (adminUpdateDto.address) updateData.address = adminUpdateDto.address;
        if (adminUpdateDto.contact) updateData.contact = adminUpdateDto.contact;
        if (adminUpdateDto.businessHours) updateData.businessHours = adminUpdateDto.businessHours;

        const updatedStore = await this.storeModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('owner', 'name email role')
            .exec();

        if (!updatedStore) {
            throw new NotFoundException('Store not found');
        }

        return updatedStore;
    }

    /**
     * ADMIN: Toggle store active status
     */
    async toggleActive(id: string): Promise<StoreDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid store ID');
        }

        const store = await this.storeModel.findById(id).exec();

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        store.isActive = !store.isActive;
        return store.save();
    }

    /**
     * ADMIN: Delete store
     */
    async delete(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid store ID');
        }

        const result = await this.storeModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException('Store not found');
        }
    }

    /**
     * PUBLIC: Find nearby stores (geolocation)
     */
    async findNearby(
        userLat: number,
        userLng: number,
        maxDistanceKm: number = 5
    ): Promise<Store[]> {
        return this.storeModel
            .find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [userLng, userLat] // [lng, lat]
                        },
                        $maxDistance: maxDistanceKm * 1000 // Convert km to meters
                    }
                },
                isActive: true
            })
            .limit(20)
            .populate('owner', 'name email')
            .exec();
    }
}