"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TRANSFER_AUTHORITY_NAME = exports.WSOL_MINT = exports.TRANSFER_AUTHORITY_IDL = exports.TRANSFER_SEED = exports.LISTING_SEED = exports.MARKETPLACE_SEED = exports.TRANSFER_AUTHORITY_SEED = exports.TRANSFER_AUTHORITY_ADDRESS = void 0;
const tslib_1 = require("tslib");
const web3_js_1 = require("@solana/web3.js");
const TRANSFER_AUTHORITY_TYPES = tslib_1.__importStar(require("../../idl/cardinal_transfer_authority"));
exports.TRANSFER_AUTHORITY_ADDRESS = new web3_js_1.PublicKey("638EtvgGQTmc2jc9SdAPtLSCjSXRrkyBfSd54xP2pquZ");
exports.TRANSFER_AUTHORITY_SEED = "transfer-authority";
exports.MARKETPLACE_SEED = "marketplace";
exports.LISTING_SEED = "listing";
exports.TRANSFER_SEED = "transfer";
exports.TRANSFER_AUTHORITY_IDL = TRANSFER_AUTHORITY_TYPES.IDL;
exports.WSOL_MINT = new web3_js_1.PublicKey("So11111111111111111111111111111111111111112");
exports.DEFAULT_TRANSFER_AUTHORITY_NAME = "global";
//# sourceMappingURL=constants.js.map