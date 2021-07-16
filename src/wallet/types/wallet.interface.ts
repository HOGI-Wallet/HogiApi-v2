export interface WalletInterface {
  wif?: string;
  path: string;
  _publicKey: string;
  _privateKey: string;
  seed: Buffer | string;
  address: string;
}
