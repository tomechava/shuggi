📝 Explicación del Service:
1. Constructor con ConfigService:
typescriptconstructor(
  @InjectModel(Pack.name) private packModel: Model<PackDocument>,
  private configService: ConfigService,
) {
  this.minDiscountPercentage = this.configService.get('MIN_DISCOUNT_PERCENTAGE', 40);
  // ... etc
}
Lee configuración de variables de entorno para que sean ajustables.
2. Métodos privados de validación:

calculatePricing() - Calcula automáticamente descuento, comisión, ganancias
validateDiscount() - Verifica que el descuento esté entre 40%-80%
validateDietaryTags() - Evita inconsistencias (ej: vegan + contains-dairy)
validatePackDate() - Verifica rango de fechas permitido

3. Métodos para STORE:

create() - Crear pack con todas las validaciones
findByStore() - Ver todos los packs de mi tienda
updateByStore() - Actualizar campos limitados
updatePackTimes() - Cambiar fecha/horarios (regla 24h)
updatePackPrice() - Cambiar precios (solo sin reservas)
changeStatus() - DRAFT ↔ AVAILABLE, CANCELLED
delete() - Eliminar (solo sin reservas)

4. Métodos PUBLIC:

findAll() - Listar packs disponibles
findById() - Ver detalle de pack
findWithFilters() - Búsqueda con filtros
findNearby() - Geolocalización + filtros

5. Métodos ADMIN:

findAllAdmin() - Ver todos los packs
updateByAdmin() - Actualizar cualquier campo

6. Métodos SYSTEM (cron jobs futuros):

cleanupExpiredPacks() - Marcar packs expirados
updateSoldOutStatus() - Actualizar status según disponibilidad


## 📦 Resumen de DTOs creados:
```
src/packs/dto/
├── create-pack.dto.ts         ✅ Crear pack
├── update-pack.dto.ts         ✅ Store owner edita
├── admin-update-pack.dto.ts   ✅ Admin edita todo
├── update-pack-times.dto.ts   ✅ Cambiar fecha/horarios (validación especial)
├── update-pack-price.dto.ts   ✅ Cambiar precios (validación especial)
├── pack-filters.dto.ts        ✅ Búsquedas y filtros
└── index.ts                   ✅ Exports

📝 Explicación del schema:

Relaciones:

store: Types.ObjectId → Cada pack pertenece a una tienda
Usamos ref: 'Store' para poder hacer .populate('store')


Fechas y horarios:

availableDate: Date object (ej: 2025-02-16)
pickupTimeStart/End: Strings en formato "HH:MM"


Cantidades:

quantity: Total de packs disponibles
quantityReserved: Los que ya fueron reservados
quantityAvailable se calcula dinámicamente: quantity - quantityReserved


Precios (auto-calculados):

discountPercentage = ((originalPrice - discountedPrice) / originalPrice) * 100
platformCommission = discountedPrice * platformCommissionRate
storeEarnings = discountedPrice - platformCommission


Dietary info:

tags: Características positivas (vegetarian, keto, etc)
allergens: Advertencias (contains-nuts, etc)
notes: Texto libre adicional


Estados:

DRAFT: Creado pero no publicado
AVAILABLE: Visible para usuarios
SOLD_OUT: Sin stock
EXPIRED: Pasó la fecha/hora
CANCELLED: Tienda canceló


Índices:

Optimizan búsquedas frecuentes (por tienda, fecha, status)



## 📋 Resumen de límites:

| Límite | Valor | Significado |
|--------|-------|-------------|
| `quantity` por pack | **10** | Máximo 10 unidades en UN pack |
| `maxPacksPerDay` | **2** | Máximo 2 packs por fecha |
| `maxActivePacks` | **14** | Máximo 14 packs publicados simultáneamente |
| `maxAdvanceDays` | **7** | Publicar con máximo 7 días de anticipación |


📝 Explicación del Controller:Rutas PUBLIC (sin autenticación):
GET /packs                    - Lista packs disponibles
GET /packs/search             - Búsqueda con filtros
GET /packs/nearby             - Geolocalización
GET /packs/:id                - Ver detalle de un packRutas STORE (role STORE):
POST   /packs                 - Crear pack
GET    /packs/my-packs        - Ver mis packs (TODO)
PATCH  /packs/:id             - Actualizar pack (TODO)
PATCH  /packs/:id/times       - Cambiar horarios (TODO)
PATCH  /packs/:id/price       - Cambiar precio (TODO)
PATCH  /packs/:id/status      - Cambiar status (TODO)
DELETE /packs/:id             - Eliminar pack (TODO)Rutas ADMIN:
GET /packs/admin/all          - Todos los packs
PUT /packs/:id/admin          - Actualizar cualquier campo