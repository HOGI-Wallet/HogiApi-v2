declare namespace NewTXEndPoint {
  export interface Input {
    prev_hash: string;
    output_index: number;
    output_value: number;
    sequence: number;
    addresses: string[];
    script_type: string;
    age: number;
  }

  export interface Output {
    value: number;
    script: string;
    addresses: string[];
    script_type: string;
  }

  export interface Tx {
    block_height: number;
    block_index: number;
    hash: string;
    addresses: string[];
    total: number;
    fees: number;
    size: number;
    preference: string;
    relayed_by: string;
    received: string;
    ver: number;
    double_spend: boolean;
    vin_sz: number;
    vout_sz: number;
    confirmations: number;
    inputs: Input[];
    outputs: Output[];
  }

  export interface INewTx {
    tx: Tx;
    tosign_tx?: string[];
    tosign: string[];
  }
}
