import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type BN from "bn.js";
export declare const withWrapToken: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey, transferAuthorityInfo?: {
    transferAuthorityName: string;
    setInvalidator?: boolean;
}, payer?: PublicKey) => Promise<[Transaction, PublicKey]>;
export declare const withInitTransferAuthority: (transaction: Transaction, connection: Connection, wallet: Wallet, name: string, authority?: PublicKey, payer?: PublicKey, allowedMarketplaces?: PublicKey[]) => Promise<[Transaction, PublicKey]>;
export declare const withUpdateTransferAuthority: (transaction: Transaction, connection: Connection, wallet: Wallet, name: string, authority: PublicKey, allowedMarketplaces?: PublicKey[] | null) => Promise<Transaction>;
export declare const withInitMarketplace: (transaction: Transaction, connection: Connection, wallet: Wallet, name: string, transferAuthorityName: string, paymentManagerName: string, paymentMints?: PublicKey[], payer?: PublicKey) => Promise<[Transaction, PublicKey]>;
export declare const withUpdateMarketplace: (transaction: Transaction, connection: Connection, wallet: Wallet, name: string, transferAuthorityName: string, paymentManagerName: string, authority: PublicKey, paymentMints: PublicKey[]) => Promise<Transaction>;
export declare const withCreateListing: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey, markeptlaceName: string, paymentAmount: BN, paymentMint?: PublicKey, payer?: PublicKey) => Promise<[Transaction, PublicKey]>;
export declare const withUpdateListing: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey, paymentAmount: BN, paymentMint: PublicKey) => Promise<Transaction>;
export declare const withRemoveListing: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey, listingTokenAccountId: PublicKey) => Promise<Transaction>;
export declare const withAcceptListing: (transaction: Transaction, connection: Connection, wallet: Wallet, buyer: PublicKey, mintId: PublicKey) => Promise<Transaction>;
export declare const withWhitelistMarektplaces: (transaction: Transaction, connection: Connection, wallet: Wallet, transferAuthorityName: string, marketplaceNames: string[]) => Promise<Transaction>;
export declare const withInitTransfer: (transaction: Transaction, connection: Connection, wallet: Wallet, to: PublicKey, mintId: PublicKey, holderTokenAccountId: PublicKey, payer?: PublicKey) => Promise<Transaction>;
export declare const withCancelTransfer: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey) => Promise<Transaction>;
export declare const withAcceptTransfer: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey, recipient: PublicKey, holder: PublicKey) => Promise<Transaction>;
export declare const withRelease: (transaction: Transaction, connection: Connection, wallet: Wallet, mintId: PublicKey, transferAuthorityId: PublicKey, holderTokenAccountId: PublicKey, payer?: PublicKey) => Promise<Transaction>;
//# sourceMappingURL=marketplace.d.ts.map