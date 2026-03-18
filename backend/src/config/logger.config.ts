import * as path from 'path';
import * as fs from 'fs';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

const logsDir = path.join(process.cwd(), 'logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Winston Logger Configuration
 * Configura logging estructurado con transports para:
 * - Console (desarrollo)
 * - Archivo (desarrollo y producción)
 */
export const winstonConfig = {
  transports: [
    // Console transport - siempre activo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('Shuggi', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // Error file transport - solo errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined file transport - todos los logs
    new winston.transports.File({
      filename: path.join(logsDir, 'application.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],

  // Nivel de log según el ambiente
  level: isDevelopment ? 'debug' : 'info',
};

export default winstonConfig;
