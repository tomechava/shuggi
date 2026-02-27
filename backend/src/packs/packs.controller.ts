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
import { PacksService } from './packs.service';
import { StoresService } from '../stores/stores.service'; // ← AGREGAR
import {
    CreatePackDto,
    UpdatePackDto,
    AdminUpdatePackDto,
    UpdatePackTimesDto,
    UpdatePackPriceDto,
    PackFiltersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { PackStatus } from './schemas/pack.schema';

@Controller('packs')
export class PacksController {
    constructor(
        private readonly packsService: PacksService,
        private readonly storesService: StoresService, // ← AGREGAR
    ) { }

    /**
     * PUBLIC: Get all available packs
     * GET /packs
     */
    @Get()
    async findAll() {
        return this.packsService.findAll();
    }

    /**
     * PUBLIC: Search packs with filters
     * GET /packs/search?storeId=xxx&maxPrice=6000&dietaryTags=vegetarian,vegan
     */
    @Get('search')
    async search(@Query() filters: PackFiltersDto) {
        return this.packsService.findWithFilters(filters);
    }

    /**
     * PUBLIC: Find nearby packs (geolocation)
     * GET /packs/nearby?lat=4.6533&lng=-74.0575&radius=5&maxPrice=6000
     */
    @Get('nearby')
    async findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius?: string,
        @Query() filters?: PackFiltersDto,
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

        return this.packsService.findNearby(latitude, longitude, maxDistance, filters);
    }

    /**
     * ADMIN: Get all packs (including expired/cancelled)
     * GET /packs/admin/all
     */
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAllAdmin() {
        return this.packsService.findAllAdmin();
    }

    /**
    * STORE: Get my store's packs
    * GET /packs/my-packs
    */
    @Get('my-packs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async getMyPacks(@Request() req) {
        const store = await this.storesService.findByOwner(req.user.id);
        return this.packsService.findByStore(store._id.toString());
    }

    /**
     * PUBLIC: Get pack by ID
     * GET /packs/:id
     */
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.packsService.findById(id);
    }

    /**
    * STORE: Create new pack
    * POST /packs
    */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async create(@Body() createPackDto: CreatePackDto, @Request() req) {
        const store = await this.storesService.findByOwner(req.user.id);

        // Validate that the storeId in DTO matches user's store
        if (createPackDto.storeId !== store._id.toString()) {
            throw new BadRequestException('You can only create packs for your own store');
        }

        return this.packsService.create(createPackDto, store._id.toString());
    }

    /**
    * STORE: Update pack (limited fields)
    * PATCH /packs/:id
    */
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async update(
        @Param('id') id: string,
        @Body() updatePackDto: UpdatePackDto,
        @Request() req,
    ) {
        const store = await this.storesService.findByOwner(req.user.id);
        return this.packsService.updateByStore(id, store._id.toString(), updatePackDto);
    }

    /**
    * STORE: Update pack times (date/pickup hours)
    * PATCH /packs/:id/times
    */
    @Patch(':id/times')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async updateTimes(
        @Param('id') id: string,
        @Body() updateTimesDto: UpdatePackTimesDto,
        @Request() req,
    ) {
        const store = await this.storesService.findByOwner(req.user.id);
        return this.packsService.updatePackTimes(id, store._id.toString(), updateTimesDto);
    }

    /**
    * STORE: Update pack price
    * PATCH /packs/:id/price
    */
    @Patch(':id/price')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async updatePrice(
        @Param('id') id: string,
        @Body() updatePriceDto: UpdatePackPriceDto,
        @Request() req,
    ) {
        const store = await this.storesService.findByOwner(req.user.id);
        return this.packsService.updatePackPrice(id, store._id.toString(), updatePriceDto);
    }

    /**
    * STORE: Change pack status
    * PATCH /packs/:id/status
    */
    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async changeStatus(
        @Param('id') id: string,
        @Body('status') status: PackStatus,
        @Request() req,
    ) {
        const store = await this.storesService.findByOwner(req.user.id);
        return this.packsService.changeStatus(id, store._id.toString(), status);
    }

    /**
    * STORE: Delete pack
    * DELETE /packs/:id
    */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async delete(@Param('id') id: string, @Request() req) {
        const store = await this.storesService.findByOwner(req.user.id);
        await this.packsService.delete(id, store._id.toString());
        return { message: 'Pack deleted successfully' };
    }

    /**
     * ADMIN: Full update of pack
     * PUT /packs/:id/admin
     */
    @Put(':id/admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateByAdmin(
        @Param('id') id: string,
        @Body() adminUpdateDto: AdminUpdatePackDto,
    ) {
        return this.packsService.updateByAdmin(id, adminUpdateDto);
    }
}