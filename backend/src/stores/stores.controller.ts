import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto, AdminUpdateStoreDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    /**
     * PUBLIC: Get all active stores
     * GET /stores
     */
    @Get()
    async findAll() {
        return this.storesService.findAll();
    }

    /**
     * PUBLIC: Find nearby stores (geolocation)
     * GET /stores/nearby?lat=4.6533&lng=-74.0575&radius=5
     */
    @Get('nearby')
    async findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius?: string,
    ) {
        // Validate coordinates
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDistance = radius ? parseFloat(radius) : 5;

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new BadRequestException('Invalid coordinates');
        }

        if (latitude < -90 || latitude > 90) {
            throw new BadRequestException('Latitude must be between -90 and 90');
        }

        if (longitude < -180 || longitude > 180) {
            throw new BadRequestException('Longitude must be between -180 and 180');
        }

        if (maxDistance <= 0 || maxDistance > 50) {
            throw new BadRequestException('Radius must be between 0 and 50 km');
        }

        return this.storesService.findNearby(latitude, longitude, maxDistance);
    }

    /**
     * ADMIN: Get all stores (including inactive)
     * GET /stores/admin/all
     */
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAllAdmin() {
        return this.storesService.findAllAdmin();
    }

    /**
     * STORE: Get my store
     * GET /stores/my-store
     */
    @Get('my-store')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async getMyStore(@Request() req) {
        return this.storesService.findByOwner(req.user.id);
    }

    /**
       * PUBLIC: Get store by ID
       * GET /stores/:id
       */
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.storesService.findById(id);
    }

    /**
     * ADMIN: Create new store
     * POST /stores
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() createStoreDto: CreateStoreDto) {
        return this.storesService.create(createStoreDto);
    }

    /**
     * STORE: Update my store (limited fields)
     * PATCH /stores/my-store
     */
    @Patch('my-store')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async updateMyStore(
        @Request() req,
        @Body() updateStoreDto: UpdateStoreDto,
    ) {
        return this.storesService.updateByOwner(req.user.id, updateStoreDto);
    }

    /**
     * ADMIN: Full update of store
     * PUT /stores/:id
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateByAdmin(
        @Param('id') id: string,
        @Body() adminUpdateDto: AdminUpdateStoreDto,
    ) {
        return this.storesService.updateByAdmin(id, adminUpdateDto);
    }

    /**
     * ADMIN: Toggle store active status
     * PATCH /stores/:id/toggle-active
     */
    @Patch(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async toggleActive(@Param('id') id: string) {
        return this.storesService.toggleActive(id);
    }

    /**
     * ADMIN: Delete store
     * DELETE /stores/:id
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async delete(@Param('id') id: string) {
        await this.storesService.delete(id);
        return { message: 'Store deleted successfully' };
    }
}
