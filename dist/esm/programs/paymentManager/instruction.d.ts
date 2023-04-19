import type { BN } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type { AccountMeta, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const init: (connection: Connection, wallet: Wallet, name: string, params: {
    feeCollector: PublicKey;
    authority?: PublicKey;
    makerFeeBasisPoints: number;
    takerFeeBasisPoints: number;
    includeSellerFeeBasisPoints: boolean;
    royaltyFeeShare?: BN;
}) => Promise<[TransactionInstruction, PublicKey]>;
export declare const managePayment: (connection: Connection, wallet: Wallet, name: string, params: {
    paymentAmount: BN;
    payerTokenAccount: PublicKey;
    feeCollectorTokenAccount: PublicKey;
    paymentTokenAccount: PublicKey;
}) => Promise<TransactionInstruction>;
export declare const handlePaymentWithRoyalties: (connection: Connection, wallet: Wallet, name: string, params: {
    paymentAmount: BN;
    payerTokenAccount: PublicKey;
    feeCollectorTokenAccount: PublicKey;
    paymentTokenAccount: PublicKey;
    paymentMint: PublicKey;
    mint: PublicKey;
    mintMetadata: PublicKey;
    royaltiesRemainingAccounts: AccountMeta[];
}) => Promise<TransactionInstruction>;
export declare const close: (connection: Connection, wallet: Wallet, name: string, collector?: PublicKey) => Promise<TransactionInstruction>;
export declare const update: (connection: Connection, wallet: Wallet, name: string, params: {
    authority: PublicKey;
    feeCollector: PublicKey;
    makerFeeBasisPoints: number;
    takerFeeBasisPoints: number;
    royaltyFeeShare?: BN;
}) => Promise<[TransactionInstruction, PublicKey]>;
//# sourceMappingURL=instruction.d.ts.map