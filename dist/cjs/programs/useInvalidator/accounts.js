"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUseInvalidators = exports.getUseInvalidator = void 0;
const anchor_1 = require("@project-serum/anchor");
const solana_contrib_1 = require("@saberhq/solana-contrib");
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const getUseInvalidator = async (connection, useInvalidatorId) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const useInvalidatorProgram = new anchor_1.Program(constants_1.USE_INVALIDATOR_IDL, constants_1.USE_INVALIDATOR_ADDRESS, provider);
    const parsed = await useInvalidatorProgram.account.useInvalidator.fetch(useInvalidatorId);
    return {
        parsed,
        pubkey: useInvalidatorId,
    };
};
exports.getUseInvalidator = getUseInvalidator;
const getUseInvalidators = async (connection, useInvalidatorIds) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const useInvalidatorProgram = new anchor_1.Program(constants_1.USE_INVALIDATOR_IDL, constants_1.USE_INVALIDATOR_ADDRESS, provider);
    let useInvalidators = [];
    try {
        useInvalidators =
            (await useInvalidatorProgram.account.useInvalidator.fetchMultiple(useInvalidatorIds));
    }
    catch (e) {
        console.log(e);
    }
    return useInvalidators.map((tm, i) => ({
        parsed: tm,
        pubkey: useInvalidatorIds[i],
    }));
};
exports.getUseInvalidators = getUseInvalidators;
//# sourceMappingURL=accounts.js.map