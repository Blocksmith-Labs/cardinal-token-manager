"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USE_INVALIDATOR_IDL = exports.USE_INVALIDATOR_SEED = exports.USE_INVALIDATOR_ADDRESS = void 0;
const tslib_1 = require("tslib");
const web3_js_1 = require("@solana/web3.js");
const USE_INVALIDATOR_TYPES = tslib_1.__importStar(require("../../idl/cardinal_use_invalidator"));
exports.USE_INVALIDATOR_ADDRESS = new web3_js_1.PublicKey("7Qt3zVnqXuxqtzZy8iMyhnFfHdcv2UdqweoHvHKtiah1");
exports.USE_INVALIDATOR_SEED = "use-invalidator";
exports.USE_INVALIDATOR_IDL = USE_INVALIDATOR_TYPES.IDL;
//# sourceMappingURL=constants.js.map