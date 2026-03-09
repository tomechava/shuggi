## 📝 Explicación del Schema:

### **Estados (OrderStatus):**

PENDING_PAYMENT (15 min timer)
    ↓ (usuario paga)
PAYMENT_PROCESSING
    ↓ (PayU confirma)
CONFIRMED
    ↓ (día del pickup)
READY_FOR_PICKUP
    ↓ (escanea QR)
COMPLETED ✅

Flujos alternativos:
PENDING_PAYMENT → EXPIRED (no pagó en 15 min)
CONFIRMED → CANCELLED (canceló >24h antes)
CONFIRMED → NO_SHOW (no recogió)
CANCELLED → REFUNDED (procesó reembolso)


## 📦 Resumen de DTOs creados:

src/orders/dto/
├── create-order.dto.ts        ✅ Crear orden
├── cancel-order.dto.ts        ✅ Cancelar orden
├── confirm-pickup.dto.ts      ✅ Confirmar recogida
├── order-filters.dto.ts       ✅ Filtros de búsqueda
├── update-order-status.dto.ts ✅ Actualizar estado (admin)
└── index.ts                   ✅ Exports

📝 Explicación del Service:
Métodos principales:
1. create() - Crear orden:

Valida pack disponible
Calcula fees de PayU
Calcula comisión de Shuggi
Genera código de pickup (6 dígitos)
Reserva cantidad en pack
Timer de 15 minutos

2. markAsPaid() - Marcar como pagada:

Llamado por webhook de PayU (Sprint 5)
Cambia status a CONFIRMED

3. cancel() - Cancelar orden:

Si PENDING_PAYMENT: cancela gratis
Si CONFIRMED: calcula penalización



24h antes: reembolso completo


<24h antes: retiene PayU fee


Libera cantidad del pack

4. confirmPickup() - Confirmar recogida:

Store escanea código de 6 dígitos
Valida fecha de pickup
Marca como COMPLETED

5. Sistema automático:

expireUnpaidOrders() - Cron job cada minuto
markNoShows() - Cron job cada hora



## 📝 Resumen de Endpoints:

### **USER:**
```
POST   /orders                      - Crear orden (reservar pack)
GET    /orders/my-orders             - Ver mis órdenes
GET    /orders/:id                   - Ver detalle de orden
PATCH  /orders/:id/cancel            - Cancelar orden
```

### **STORE:**
```
GET    /orders/store/my-orders       - Ver órdenes de mi tienda
POST   /orders/store/confirm-pickup  - Confirmar recogida con código
```

### **ADMIN:**
```
GET    /orders/admin/all             - Ver todas las órdenes
PATCH  /orders/admin/:id/status      - Cambiar status de orden
```

### **SYSTEM (temporal para testing):**
```
POST   /orders/system/expire-unpaid  - Expirar órdenes no pagadas
POST   /orders/system/mark-no-shows  - Marcar no-shows
