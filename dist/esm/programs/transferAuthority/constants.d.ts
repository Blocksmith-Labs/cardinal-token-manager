import type { AnchorTypes } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";
import * as TRANSFER_AUTHORITY_TYPES from "../../idl/cardinal_transfer_authority";
export declare const TRANSFER_AUTHORITY_ADDRESS: PublicKey;
export declare const TRANSFER_AUTHORITY_SEED = "transfer-authority";
export declare const MARKETPLACE_SEED = "marketplace";
export declare const LISTING_SEED = "listing";
export declare const TRANSFER_SEED = "transfer";
export declare const TRANSFER_AUTHORITY_IDL: TRANSFER_AUTHORITY_TYPES.CardinalTransferAuthority;
export declare type TRANSFER_AUTHORITY_PROGRAM = TRANSFER_AUTHORITY_TYPES.CardinalTransferAuthority;
export declare type TransferAuthorityTypes = AnchorTypes<TRANSFER_AUTHORITY_PROGRAM, {
    tokenManager: TransferAuthorityData;
}>;
export declare const WSOL_MINT: PublicKey;
export declare const DEFAULT_TRANSFER_AUTHORITY_NAME = "global";
declare type Accounts = TransferAuthorityTypes["Accounts"];
export declare type TransferAuthorityData = Accounts["transferAuthority"];
export declare type MarketplaceData = Accounts["marketplace"];
export declare type ListingData = Accounts["listing"];
export declare type TransferData = Accounts["transfer"];
export {};
//# sourceMappingURL=constants.d.ts.map