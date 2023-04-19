import { PublicKey } from "@solana/web3.js";
/**
 * Finds the address of the transfer authority.
 * @returns
 */
export declare const findTransferAuthorityAddress: (name: string) => Promise<[PublicKey, number]>;
/**
 * Finds the address of the marketplace.
 * @returns
 */
export declare const findMarketplaceAddress: (name: string) => Promise<[PublicKey, number]>;
/**
 * Finds the address of the listing.
 * @returns
 */
export declare const findListingAddress: (mintId: PublicKey) => Promise<[PublicKey, number]>;
/**
 * Finds the address of the transfer.
 * @returns
 */
export declare const findTransferAddress: (mintId: PublicKey) => Promise<[PublicKey, number]>;
//# sourceMappingURL=pda.d.ts.map