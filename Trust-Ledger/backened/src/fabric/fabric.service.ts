import { Inject, Injectable } from '@nestjs/common';
import { FABRIC_GATEWAY } from './fabric.types';
import type { FabricFunctionName, FabricGateway } from './fabric.types';

@Injectable()
export class FabricService {
  constructor(
    @Inject(FABRIC_GATEWAY)
    private readonly gateway: FabricGateway,
  ) {}

  submit(functionName: FabricFunctionName, payload: unknown) {
    return this.gateway.submit(functionName, payload);
  }

  evaluate(functionName: FabricFunctionName, payload: unknown) {
    return this.gateway.evaluate(functionName, payload);
  }
}
