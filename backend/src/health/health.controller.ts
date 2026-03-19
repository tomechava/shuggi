import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly dbConnection: Connection,
  ) { }

  @Get()
  check() {
    // mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbState = this.dbConnection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
    };
  }
}