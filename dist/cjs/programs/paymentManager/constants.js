"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_MANAGER_IDL = exports.DEFAULT_PAYMENT_MANAGER_NAME = exports.PAYMENT_MANAGER_SEED = exports.PAYMENT_MANAGER_ADDRESS = exports.BASIS_POINTS_DIVISOR = void 0;
const tslib_1 = require("tslib");
const web3_js_1 = require("@solana/web3.js");
const PAYMENT_MANAGER_TYPES = tslib_1.__importStar(require("../../idl/cardinal_payment_manager"));
exports.BASIS_POINTS_DIVISOR = 10000;
exports.PAYMENT_MANAGER_ADDRESS = new web3_js_1.PublicKey("pmBbdddvcssmfNgNfu8vgULnhTAcnrn841K5QVhh5VV");
exports.PAYMENT_MANAGER_SEED = "payment-manager";
exports.DEFAULT_PAYMENT_MANAGER_NAME = "cardinal";
exports.PAYMENT_MANAGER_IDL = PAYMENT_MANAGER_TYPES.IDL;
//# sourceMappingURL=constants.js.map