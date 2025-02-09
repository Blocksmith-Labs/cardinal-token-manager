import type { AccountData } from "@cardinal/common";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type { AccountMeta, Connection } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import type { TokenManagerData } from ".";
import { TokenManagerKind } from ".";
export declare const getRemainingAccountsForKind: (mintId: PublicKey, tokenManagerKind: TokenManagerKind) => AccountMeta[];
export declare const getRemainingAccountsForUnissue: (tokenManagerId: PublicKey, tokenManagerData: TokenManagerData, metadata: Metadata | null) => AccountMeta[];
/**
 * Convenience method to get remaining accounts for invalidation
 * NOTE: This ignores token account creation and assumes that is handled outside. Use withRemainingAccountsForInvalidate
 * to include token account creation in the current transaction
 * @param connection
 * @param mintId
 * @returns
 */
export declare const getRemainingAccountsForInvalidate: (connection: Connection, wallet: Wallet, mintId: PublicKey) => Promise<AccountMeta[]>;
export declare const withRemainingAccountsForInvalidate: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey, tokenManagerData: AccountData<TokenManagerData>, recipientTokenAccountOwnerId: PublicKey, metadata: Metadata | null) => Promise<AccountMeta[]>;
export declare const withRemainingAccountsForReturn: (transaction: Transaction, connection: Connection, wallet: Wallet, tokenManagerData: AccountData<TokenManagerData>, recipientTokenAccountOwnerId?: PublicKey, rulesetId?: PublicKey) => Promise<AccountMeta[]>;
export declare const getRemainingAccountsForTransfer: (transferAuthority: PublicKey | null, tokenManagerId: PublicKey) => AccountMeta[];
export declare const remainingAccountForProgrammable: (mintId: PublicKey, fromTokenAccountId: PublicKey, toTokenAccountId: PublicKey, rulesetId: PublicKey | undefined) => AccountMeta[];
export declare const remainingAccountForProgrammableUnlockAndTransfer: (recipient: PublicKey, payer: PublicKey, mintId: PublicKey, fromTokenAccountId: PublicKey, rulesetId: PublicKey) => AccountMeta[];
export declare const getRemainingAccountsForIssue: (tokenManagerKind: TokenManagerKind, mintId: PublicKey, issuerTokenAccountId: PublicKey, tokenManagerTokenAccountId: PublicKey, rulesetId?: PublicKey) => AccountMeta[];
export declare const getRemainingAccountsForClaim: (tokenManagerData: AccountData<TokenManagerData>, recipientTokenAccountId: PublicKey, metadata: Metadata | null, claimReceiptId?: PublicKey) => AccountMeta[];
export declare function findTokenRecordId(mint: PublicKey, token: PublicKey): PublicKey;
export declare const findRuleSetId: (authority: PublicKey, name: string) => PublicKey;
//# sourceMappingURL=utils.d.ts.map