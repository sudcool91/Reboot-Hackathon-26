import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/fabric')
export class FabricController {
  @Get('health')
  health() {
    const mode = process.env.FABRIC_GATEWAY_MODE ?? 'inmemory';
    return {
      status: 'UP',
      mode,
      message:
        mode === 'sdk'
          ? 'Fabric SDK mode selected. Configure network client implementation.'
          : 'In-memory gateway mode enabled for development.',
    };
  }
}
