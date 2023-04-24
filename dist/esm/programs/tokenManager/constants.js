import { PublicKey } from "@solana/web3.js";
import * as TOKEN_MANAGER_TYPES from "../../idl/cardinal_token_manager";
export const TOKEN_MANAGER_ADDRESS = new PublicKey("9KU8ogB4tKAgfxxz94dWq7V5UDB41kMyDeAtq3xMwnjh");
export const MINT_COUNTER_SEED = "mint-counter";
export const MINT_MANAGER_SEED = "mint-manager";
export const TRANSFER_RECEIPT_SEED = "transfer-receipt";
export const CLAIM_RECEIPT_SEED = "claim-receipt";
export const TOKEN_MANAGER_SEED = "token-manager";
export const RECEIPT_MINT_MANAGER_SEED = "receipt-mint-manager";
export const TOKEN_MANAGER_IDL = TOKEN_MANAGER_TYPES.IDL;
export var TokenManagerKind;
(function (TokenManagerKind) {
    TokenManagerKind[TokenManagerKind["Managed"] = 1] = "Managed";
    TokenManagerKind[TokenManagerKind["Unmanaged"] = 2] = "Unmanaged";
    TokenManagerKind[TokenManagerKind["Edition"] = 3] = "Edition";
    TokenManagerKind[TokenManagerKind["Permissioned"] = 4] = "Permissioned";
})(TokenManagerKind || (TokenManagerKind = {}));
export var InvalidationType;
(function (InvalidationType) {
    InvalidationType[InvalidationType["Return"] = 1] = "Return";
    InvalidationType[InvalidationType["Invalidate"] = 2] = "Invalidate";
    InvalidationType[InvalidationType["Release"] = 3] = "Release";
    InvalidationType[InvalidationType["Reissue"] = 4] = "Reissue";
    InvalidationType[InvalidationType["Vest"] = 5] = "Vest";
})(InvalidationType || (InvalidationType = {}));
export var TokenManagerState;
(function (TokenManagerState) {
    TokenManagerState[TokenManagerState["Initialized"] = 0] = "Initialized";
    TokenManagerState[TokenManagerState["Issued"] = 1] = "Issued";
    TokenManagerState[TokenManagerState["Claimed"] = 2] = "Claimed";
    TokenManagerState[TokenManagerState["Invalidated"] = 3] = "Invalidated";
})(TokenManagerState || (TokenManagerState = {}));
export const CRANK_KEY = new PublicKey("crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr");
//# sourceMappingURL=constants.js.map