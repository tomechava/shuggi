import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 *
 * Captura todas las excepciones HTTP y las formatea de manera consistente.
 * En desarrollo expone stacktraces, en producción solo mensaje seguro.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extraer mensaje del error
    let message = 'Internal server error';
    let details = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const errorObj = exceptionResponse as any;
      message = errorObj.message || message;
      details = errorObj.message;

      // En desarrollo, incluir validación de detalles
      if (process.env.NODE_ENV === 'development' && errorObj.error) {
        details = errorObj.error;
      }
    } else {
      message = exceptionResponse as string;
    }

    // Loguear el error
    const logLevel = status >= 500 ? 'error' : 'warn';
    this.logger[logLevel](
      `${request.method} ${request.url} - ${status}`,
      {
        statusCode: status,
        message,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    );

    // Construir respuesta
    const response_body = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // En desarrollo, incluir detalles adicionales
    if (process.env.NODE_ENV === 'development' && details) {
      (response_body as any).details = details;
    }

    // En desarrollo, incluir stacktrace solo para errores 500+
    if (
      process.env.NODE_ENV === 'development' &&
      status >= HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      (response_body as any).stack = exception.stack;
    }

    response.status(status).json(response_body);
  }
}
