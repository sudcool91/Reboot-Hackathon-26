import { Injectable, NotImplementedException } from '@nestjs/common';
import type { FabricFunctionName, FabricGateway } from '../fabric.types';

@Injectable()
export class SdkFabricGateway implements FabricGateway {
  async submit(functionName: FabricFunctionName, payload: unknown) {
    throw new NotImplementedException(
      `Fabric SDK submit is not configured yet for function ${functionName}.`,
    );
  }

  async evaluate(functionName: FabricFunctionName, payload: unknown) {
    throw new NotImplementedException(
      `Fabric SDK evaluate is not configured yet for function ${functionName}.`,
    );
  }
}
