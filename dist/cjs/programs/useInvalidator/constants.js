"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInvalidatorProgram =
  exports.USE_INVALIDATOR_IDL =
  exports.USE_INVALIDATOR_SEED =
  exports.USE_INVALIDATOR_ADDRESS =
    void 0;
const tslib_1 = require("tslib");
const common_1 = require("@cardinal/common");
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
const USE_INVALIDATOR_TYPES = tslib_1.__importStar(
  require("../../idl/cardinal_use_invalidator")
);
exports.USE_INVALIDATOR_ADDRESS = new web3_js_1.PublicKey(
  "t5DEoCV1arWsMSCurX19CpFASKVyqrvvvDmFvWiGLoE"
);
exports.USE_INVALIDATOR_SEED = "use-invalidator";
exports.USE_INVALIDATOR_IDL = USE_INVALIDATOR_TYPES.IDL;
const useInvalidatorProgram = (connection, wallet, confirmOptions) => {
  return new anchor_1.Program(
    exports.USE_INVALIDATOR_IDL,
    exports.USE_INVALIDATOR_ADDRESS,
    new anchor_1.AnchorProvider(
      connection,
      wallet !== null && wallet !== void 0
        ? wallet
        : (0, common_1.emptyWallet)(web3_js_1.Keypair.generate().publicKey),
      confirmOptions !== null && confirmOptions !== void 0 ? confirmOptions : {}
    )
  );
};
exports.useInvalidatorProgram = useInvalidatorProgram;
//# sourceMappingURL=constants.js.map
