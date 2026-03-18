## 📝 Explicación del Service:

### **Métodos principales:**

**1. `generatePaymentUrl()`**
- Obtiene la orden
- Valida que esté en PENDING_PAYMENT
- Genera firma MD5 de seguridad
- Retorna datos del formulario de PayU

**2. `processWebhook()`**
- Recibe notificación de PayU
- Valida firma (seguridad anti-fraude)
- Procesa según estado:
  - `4` APPROVED → Confirmar orden
  - `6` DECLINED → Rechazado
  - `7` PENDING → En proceso
  - `5` EXPIRED → Expirado

**3. `generateSignature()`**
- Genera firma MD5 para request
- Formato: `md5(apiKey~merchantId~reference~amount~currency)`

**4. `validateWebhookSignature()`**
- Valida firma del webhook
- Formato: `md5(apiKey~merchantId~reference~amount~currency~state)`
- **CRÍTICO:** Previene fraude

---

## 📊 Flujo completo:
```
1. Usuario crea orden
   ↓
2. Backend genera URL de pago con firma
   ↓
3. Usuario redirige a PayU
   ↓
4. Usuario paga en PayU
   ↓
5. PayU envía webhook a /payments/webhook
   ↓
6. Backend valida firma
   ↓
7. Si válido → markAsPaid()
   ↓
8. Usuario redirige a frontend con resultado



## 📝 Explicación de Endpoints:

### **1. POST /payments/generate-payment**
- Usuario autenticado
- Genera datos del formulario de PayU
- Retorna JSON con la info

### **2. POST /payments/checkout/:orderId**
- Usuario autenticado
- Genera HTML con formulario que se auto-envía a PayU
- Redirige automáticamente al usuario a la página de pago
- **Este es el que usaremos en la práctica**

### **3. POST /payments/webhook** ⚠️ IMPORTANTE
- **SIN autenticación** (PayU lo llama directamente)
- Recibe confirmación de pago
- Valida firma de seguridad
- Actualiza orden según estado del pago

### **4. GET /payments/status/:orderId**
- Usuario autenticado
- Consulta estado del pago de su orden

---

## 📊 Flujo completo de pago:
```
1. Usuario crea orden → PENDING_PAYMENT
   ↓
2. Frontend/Usuario llama: POST /payments/checkout/:orderId
   ↓
3. Backend genera HTML con formulario auto-submit
   ↓
4. Usuario redirige a PayU (formulario se envía automáticamente)
   ↓
5. Usuario paga en PayU
   ↓
6. PayU envía webhook a: POST /payments/webhook
   ↓
7. Backend valida firma y marca orden como CONFIRMED
   ↓
8. PayU redirige usuario a: PAYU_RESPONSE_URL (tu frontend)