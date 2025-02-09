"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenManagerProgram =
  exports.CRANK_KEY =
  exports.TokenManagerState =
  exports.InvalidationType =
  exports.TokenManagerKind =
  exports.TOKEN_MANAGER_IDL =
  exports.RECEIPT_MINT_MANAGER_SEED =
  exports.TOKEN_MANAGER_SEED =
  exports.CLAIM_RECEIPT_SEED =
  exports.TRANSFER_RECEIPT_SEED =
  exports.MINT_MANAGER_SEED =
  exports.MINT_COUNTER_SEED =
  exports.TOKEN_MANAGER_ADDRESS =
    void 0;
const tslib_1 = require("tslib");
const common_1 = require("@cardinal/common");
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
const TOKEN_MANAGER_TYPES = tslib_1.__importStar(
  require("../../idl/cardinal_token_manager")
);
exports.TOKEN_MANAGER_ADDRESS = new web3_js_1.PublicKey(
  "3yMZ4nfMvZhcgAcvmiUZoHVW4eX3opFhHPCf1wX1Be8k"
);
exports.MINT_COUNTER_SEED = "mint-counter";
exports.MINT_MANAGER_SEED = "mint-manager";
exports.TRANSFER_RECEIPT_SEED = "transfer-receipt";
exports.CLAIM_RECEIPT_SEED = "claim-receipt";
exports.TOKEN_MANAGER_SEED = "token-manager";
exports.RECEIPT_MINT_MANAGER_SEED = "receipt-mint-manager";
exports.TOKEN_MANAGER_IDL = TOKEN_MANAGER_TYPES.IDL;
var TokenManagerKind;
(function (TokenManagerKind) {
  TokenManagerKind[(TokenManagerKind["Managed"] = 1)] = "Managed";
  TokenManagerKind[(TokenManagerKind["Unmanaged"] = 2)] = "Unmanaged";
  TokenManagerKind[(TokenManagerKind["Edition"] = 3)] = "Edition";
  TokenManagerKind[(TokenManagerKind["Permissioned"] = 4)] = "Permissioned";
  TokenManagerKind[(TokenManagerKind["Programmable"] = 5)] = "Programmable";
})(
  (TokenManagerKind =
    exports.TokenManagerKind || (exports.TokenManagerKind = {}))
);
var InvalidationType;
(function (InvalidationType) {
  InvalidationType[(InvalidationType["Return"] = 1)] = "Return";
  InvalidationType[(InvalidationType["Invalidate"] = 2)] = "Invalidate";
  InvalidationType[(InvalidationType["Release"] = 3)] = "Release";
  InvalidationType[(InvalidationType["Reissue"] = 4)] = "Reissue";
  InvalidationType[(InvalidationType["Vest"] = 5)] = "Vest";
})(
  (InvalidationType =
    exports.InvalidationType || (exports.InvalidationType = {}))
);
var TokenManagerState;
(function (TokenManagerState) {
  TokenManagerState[(TokenManagerState["Initialized"] = 0)] = "Initialized";
  TokenManagerState[(TokenManagerState["Issued"] = 1)] = "Issued";
  TokenManagerState[(TokenManagerState["Claimed"] = 2)] = "Claimed";
  TokenManagerState[(TokenManagerState["Invalidated"] = 3)] = "Invalidated";
})(
  (TokenManagerState =
    exports.TokenManagerState || (exports.TokenManagerState = {}))
);
exports.CRANK_KEY = new web3_js_1.PublicKey(
  "crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr"
);
const tokenManagerProgram = (connection, wallet, confirmOptions) => {
  return new anchor_1.Program(
    exports.TOKEN_MANAGER_IDL,
    exports.TOKEN_MANAGER_ADDRESS,
    new anchor_1.AnchorProvider(
      connection,
      wallet !== null && wallet !== void 0
        ? wallet
        : (0, common_1.emptyWallet)(web3_js_1.Keypair.generate().publicKey),
      confirmOptions !== null && confirmOptions !== void 0 ? confirmOptions : {}
    )
  );
};
exports.tokenManagerProgram = tokenManagerProgram;
//# sourceMappingURL=constants.js.map
