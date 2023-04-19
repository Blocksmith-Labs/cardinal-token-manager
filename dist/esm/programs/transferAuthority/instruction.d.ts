import type { BN } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type { AccountMeta, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
export declare const initTransferAuthority: (connection: Connection, wallet: Wallet, name: string, transferAuthorityId: PublicKey, authorityId: PublicKey, payer?: PublicKey, allowedMarketplaces?: PublicKey[]) => TransactionInstruction;
export declare const updateTransferAuthority: (connection: Connection, wallet: Wallet, transferAuthorityId: PublicKey, authority: PublicKey, allowedMarketplaces?: PublicKey[] | null) => TransactionInstruction;
export declare const initMarketplace: (connection: Connection, wallet: Wallet, name: string, marketplaceId: PublicKey, transferAuthority: PublicKey, paymentManager: PublicKey, paymentMints: PublicKey[] | undefined, payer?: PublicKey) => TransactionInstruction;
export declare const updateMarketplace: (connection: Connection, wallet: Wallet, marketplace: PublicKey, transferAuthority: PublicKey, paymentManager: PublicKey, authority: PublicKey, paymentMints: PublicKey[] | undefined) => TransactionInstruction;
export declare const createListing: (connection: Connection, wallet: Wallet, listingId: PublicKey, mintId: PublicKey, transferAuthorityId: PublicKey, tokenManagerId: PublicKey, marketplaceId: PublicKey, listerTokenAccount: PublicKey, paymentAmount: BN, paymentMint: PublicKey, payer?: PublicKey) => Promise<TransactionInstruction>;
export declare const updateListing: (connection: Connection, wallet: Wallet, listingId: PublicKey, marketplaceId: PublicKey, paymentAmount: BN, paymentMint: PublicKey) => TransactionInstruction;
export declare const removeListing: (connection: Connection, wallet: Wallet, listingId: PublicKey, mintId: PublicKey, listerTokenAccountId: PublicKey) => Promise<TransactionInstruction>;
export declare const acceptListing: (connection: Connection, wallet: Wallet, transferAuthorityId: PublicKey, listerPaymentTokenAccountId: PublicKey, listerMintTokenAccountId: PublicKey, lister: PublicKey, buyerPaymentTokenAccountId: PublicKey, buyerMintTokenAccountId: PublicKey, buyer: PublicKey, marketplaceId: PublicKey, mintId: PublicKey, listingId: PublicKey, tokenManagerId: PublicKey, mintMetadataId: PublicKey, transferReceiptId: PublicKey, transferId: PublicKey, paymentManagerId: PublicKey, paymentMintId: PublicKey, feeCollectorTokenAccountId: PublicKey, remainingAccounts: AccountMeta[], payer?: PublicKey) => TransactionInstruction;
export declare const whitelistMarkeplaces: (connection: Connection, wallet: Wallet, transferAuthorityId: PublicKey, whitelistMarketplaces: PublicKey[]) => TransactionInstruction;
export declare const initTransfer: (connection: Connection, wallet: Wallet, params: {
    to: PublicKey;
    transferId: PublicKey;
    tokenManagerId: PublicKey;
    holderTokenAccountId: PublicKey;
    holder: PublicKey;
    payer?: PublicKey;
}) => TransactionInstruction;
export declare const cancelTransfer: (connection: Connection, wallet: Wallet, params: {
    transferId: PublicKey;
    tokenManagerId: PublicKey;
    holderTokenAccountId: PublicKey;
    holder: PublicKey;
}) => TransactionInstruction;
export declare const acceptTransfer: (connection: Connection, wallet: Wallet, params: {
    transferId: PublicKey;
    tokenManagerId: PublicKey;
    holderTokenAccountId: PublicKey;
    holder: PublicKey;
    recipient: PublicKey;
    recipientTokenAccountId: PublicKey;
    mintId: PublicKey;
    transferReceiptId: PublicKey;
    listingId: PublicKey;
    transferAuthorityId: PublicKey;
    remainingAccounts: AccountMeta[];
}) => TransactionInstruction;
export declare const release: (connection: Connection, wallet: Wallet, params: {
    transferAuthorityId: PublicKey;
    tokenManagerId: PublicKey;
    mintId: PublicKey;
    tokenManagerTokenAccountId: PublicKey;
    holderTokenAccountId: PublicKey;
    holder: PublicKey;
    remainingAccounts: AccountMeta[];
}) => TransactionInstruction;
//# sourceMappingURL=instruction.d.ts.map