import type { Wallet } from "@saberhq/solana-contrib";
import type { AccountMeta, Connection, Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type { AccountData } from "../..";
import type { TokenManagerData } from ".";
import { TokenManagerKind } from ".";
export declare const getRemainingAccountsForKind: (mintId: PublicKey, tokenManagerKind: TokenManagerKind) => Promise<AccountMeta[]>;
export declare const withRemainingAccountsForPayment: (transaction: Transaction, connection: Connection, wallet: Wallet, mint: PublicKey, paymentMint: PublicKey, issuerId: PublicKey, paymentManagerId: PublicKey, options?: {
    payer?: PublicKey;
    receiptMint?: PublicKey | null;
}) => Promise<[PublicKey, PublicKey, AccountMeta[]]>;
export declare const withRemainingAccountsForReturn: (transaction: Transaction, connection: Connection, wallet: Wallet, tokenManagerData: AccountData<TokenManagerData>, allowOwnerOffCurve?: boolean) => Promise<AccountMeta[]>;
export declare const withRemainingAccountsForHandlePaymentWithRoyalties: (transaction: Transaction, connection: Connection, wallet: Wallet, mint: PublicKey, paymentMint: PublicKey, excludeCreators?: string[]) => Promise<AccountMeta[]>;
export declare const getRemainingAccountsForTransfer: (transferAuthority: PublicKey | null, tokenManagerId: PublicKey) => Promise<AccountMeta[]>;
//# sourceMappingURL=utils.d.ts.map