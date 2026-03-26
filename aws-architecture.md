# Shuggi — AWS Architecture (Preliminary)

> **Status:** Planificación preliminar. No implementado.
> **Última actualización:** Marzo 2026
> **Para implementar cuando:** Backend + Web Portal + App Móvil estén completos y listos para deploy.

---

## Diagrama de arquitectura

```
                              INTERNET
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
      ┌───────────────┐  ┌────────────────┐  ┌───────────────┐
      │  App Móvil    │  │  Web Browser   │  │  Web Browser  │
      │   Flutter     │  │    Admin       │  │    Store      │
      │ (iOS/Android) │  │    Staff       │  │    Owner      │
      │ Play Store /  │  └───────┬────────┘  └───────┬───────┘
      │   App Store   │          │                   │
      └───────┬───────┘          └─────────┬─────────┘
              │                            │
              │                       Route 53
              │                      shuggi.app
              │                 ┌──────────┴──────────┐
              │                 │                     │
              │        admin.shuggi.app          api.shuggi.app
              │        CloudFront + S3               ALB
              │       ┌─────────────────┐      (HTTPS 443)
              │       │   FRONTEND      │            │
              │       │  React Portal   │            │
              │       │  (Web Admin +   │            │
              │       │  Store Panel)   │            │
              │       └─────────────────┘            │
              │                                      │
              └──────────────────────────────────────┘
                                                      │
                                             ┌────────────────┐
                                             │    BACKEND     │
                                             │  EC2 Private   │
                                             │    NestJS      │
                                             │   Port 3000    │
                                             └───────┬────────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    │                                 │
                           ┌─────────────────┐             ┌─────────────────┐
                           │  MongoDB Atlas  │             │   S3 Bucket     │
                           │  (externo AWS)  │             │     Media       │
                           │  Base de datos  │             │ Imágenes, QRs   │
                           └─────────────────┘             └─────────────────┘
```

---

## Componentes y responsabilidades

### Route 53
DNS autoritativo para `shuggi.app`. Enruta:
- `admin.shuggi.app` → CloudFront (frontend React)
- `api.shuggi.app` → ALB (backend NestJS)

**Costo estimado:** ~$1/mes

---

### ACM — AWS Certificate Manager
Certificados SSL/TLS gratuitos para todos los subdominios de `shuggi.app`. Se renuevan automáticamente. El TLD `.app` exige HTTPS obligatorio en todos los browsers.

**Costo:** $0

---

### CloudFront + S3 — Frontend

El build de React (archivos estáticos HTML/JS/CSS) se almacena en S3 y se distribuye globalmente via CloudFront.

- HTTPS via ACM incluido
- CDN con edge locations cercanas a Colombia
- Sin servidor necesario para servir el frontend

**Acceso:** `admin.shuggi.app`  
**Contenido:** React Portal Web (panel Admin + panel Store)  
**Costo estimado:** ~$3-5/mes

---

### ALB — Application Load Balancer

Entry point público de la API. Responsabilidades:
- Terminar SSL (HTTPS 443 → HTTP 3000 interno)
- Health checks sobre EC2
- Permite escalar EC2 horizontalmente en el futuro sin cambiar DNS

**Acceso:** `api.shuggi.app`  
**Consumidores:** App Móvil Flutter + React Portal Web  
**Costo estimado:** ~$18/mes

---

### EC2 — Backend NestJS

Instancia en **subnet privada** — no expuesta directamente a internet. Solo el ALB puede alcanzarla.

- **Tipo inicial:** `t3.small` (2 vCPU, 2GB RAM)
- **OS:** Ubuntu 24 LTS
- **Runtime:** Node.js 24 LTS
- **App:** NestJS backend (puerto 3000 interno)
- **Acceso SSH:** via AWS Systems Manager (sin IP pública)

**Costo estimado:** ~$15/mes (t3.small)

---

### MongoDB Atlas — Base de datos

Externo a AWS. Compatible 100% con el código Mongoose existente.

- **Desarrollo:** Atlas M0 (gratis)
- **Producción:** Atlas M10 (~$57/mes, backups incluidos)
- **Conexión:** Solo acepta conexiones desde la IP de EC2 (whitelist)

**Por qué no AWS DocumentDB:** Mínimo ~$180/mes, incompatibilidades con Mongoose, no justifica el costo.

**Costo estimado producción:** ~$57/mes

---

### S3 Bucket — Media

Bucket separado del frontend. Almacena:
- Imágenes de tiendas y logos
- Fotos de packs
- QR codes de pickup

CloudFront adelante para servir imágenes rápido a usuarios finales.

**Costo estimado:** ~$2/mes

---

## Seguridad

```
Internet
    └── ALB (público, puerto 443 únicamente)
            └── EC2 (privada, solo acepta tráfico del ALB en puerto 3000)
                    └── MongoDB Atlas (whitelist IP de EC2 únicamente)
```

- EC2 sin IP pública — inaccesible directamente desde internet
- Security Groups: EC2 solo acepta tráfico del ALB
- MongoDB Atlas: solo acepta conexiones desde IP fija de EC2
- HTTPS obligatorio en todos los endpoints
- Secrets en AWS Secrets Manager (no en variables de entorno planas)

---

## Ambientes

| Ambiente | Frontend | Backend | Base de datos | Costo estimado |
|---|---|---|---|---|
| **Local dev** | localhost:5173 | localhost:3000 | Atlas M0 gratis | $0 |
| **Staging** | Railway/Render | Railway/Render | Atlas M0 gratis | ~$0-20/mes |
| **Producción** | S3 + CloudFront | EC2 t3.small | Atlas M10 | ~$98/mes |

> **Nota staging:** Se recomienda Railway o Render para staging en lugar de AWS. Más barato, menos configuración, suficiente para pruebas con tiendas piloto antes del deploy definitivo en AWS.

---

## Costo mensual estimado — Producción

| Componente | Costo |
|---|---|
| Route 53 | ~$1 |
| CloudFront (2 distribuciones) | ~$5 |
| S3 (frontend + media) | ~$2 |
| ALB | ~$18 |
| EC2 t3.small | ~$15 |
| MongoDB Atlas M10 | ~$57 |
| ACM (certificados SSL) | $0 |
| **Total estimado** | **~$98/mes** |

---

## Dominio

- **Dominio objetivo:** `shuggi.app`
- **Registrar en:** Namecheap o Google Domains (~$14/año)
- **DNS:** Transferir a Route 53 después de comprar

---

## Orden de implementación (cuando llegue el momento)

```
1.  Comprar dominio shuggi.app
2.  Crear cuenta AWS + configurar billing alerts
3.  Crear hosted zone en Route 53
4.  Solicitar certificados en ACM (us-east-1 para CloudFront)
5.  Crear S3 bucket frontend + configurar CloudFront
6.  Crear VPC + subnets públicas/privadas + security groups
7.  Crear EC2 t3.small en subnet privada
8.  Instalar Node.js 24 + PM2 en EC2
9.  Crear ALB + target group + apuntar a EC2
10. Configurar MongoDB Atlas M10 + whitelist IP EC2
11. Configurar AWS Secrets Manager con variables de entorno
12. Deploy backend NestJS en EC2
13. Build React + subir a S3 + invalidar cache CloudFront
14. Configurar DNS en Route 53 (subdominios)
15. Configurar CI/CD con GitHub Actions
16. Smoke tests en producción
```

---

## Pendiente de definir

- [ ] CI/CD pipeline — GitHub Actions (recomendado para monorepo)
- [ ] Estrategia de backups EC2 (AWS Backup o snapshots manuales)
- [ ] Monitoreo — CloudWatch básico vs Datadog
- [ ] Staging en Railway/Render vs AWS — decidir antes del piloto
- [ ] Auto Scaling Group — evaluar cuando haya métricas reales de tráfico

---

## Stack completo Shuggi

| Capa | Tecnología |
|---|---|
| App Móvil | Flutter (iOS + Android) |
| Web Portal | React + Vite + TypeScript |
| Backend API | NestJS + TypeScript |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JWT via httpOnly Cookie |
| Pagos | PayU Colombia |
| Hosting frontend | AWS S3 + CloudFront |
| Hosting backend | AWS EC2 (t3.small) |
| DNS | AWS Route 53 |
| SSL | AWS ACM |
| Media storage | AWS S3 |
| Base de datos cloud | MongoDB Atlas |