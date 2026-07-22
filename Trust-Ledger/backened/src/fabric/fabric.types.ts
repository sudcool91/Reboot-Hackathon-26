export const FABRIC_GATEWAY = Symbol('FABRIC_GATEWAY');

export type FabricFunctionName = string;

export interface FabricGateway {
  submit(functionName: FabricFunctionName, payload: unknown): Promise<unknown>;
  evaluate(functionName: FabricFunctionName, payload: unknown): Promise<unknown>;
}
