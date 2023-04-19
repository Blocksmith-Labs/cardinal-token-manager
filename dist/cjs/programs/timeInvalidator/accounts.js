"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTimeInvalidators = exports.getExpiredTimeInvalidators = exports.getTimeInvalidators = exports.getTimeInvalidator = void 0;
const anchor_1 = require("@project-serum/anchor");
const solana_contrib_1 = require("@saberhq/solana-contrib");
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const getTimeInvalidator = async (connection, timeInvalidatorId) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const timeInvalidatorProgram = new anchor_1.Program(constants_1.TIME_INVALIDATOR_IDL, constants_1.TIME_INVALIDATOR_ADDRESS, provider);
    const parsed = await timeInvalidatorProgram.account.timeInvalidator.fetch(timeInvalidatorId);
    return {
        parsed,
        pubkey: timeInvalidatorId,
    };
};
exports.getTimeInvalidator = getTimeInvalidator;
const getTimeInvalidators = async (connection, timeInvalidatorIds) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const timeInvalidatorProgram = new anchor_1.Program(constants_1.TIME_INVALIDATOR_IDL, constants_1.TIME_INVALIDATOR_ADDRESS, provider);
    let timeInvalidators = [];
    try {
        timeInvalidators =
            (await timeInvalidatorProgram.account.timeInvalidator.fetchMultiple(timeInvalidatorIds));
    }
    catch (e) {
        console.log(e);
    }
    return timeInvalidators.map((data, i) => ({
        parsed: data,
        pubkey: timeInvalidatorIds[i],
    }));
};
exports.getTimeInvalidators = getTimeInvalidators;
const getExpiredTimeInvalidators = async (connection) => {
    const programAccounts = await connection.getProgramAccounts(constants_1.TIME_INVALIDATOR_ADDRESS);
    const expiredTimeInvalidators = [];
    const coder = new anchor_1.BorshAccountsCoder(constants_1.TIME_INVALIDATOR_IDL);
    programAccounts.forEach((account) => {
        var _a;
        try {
            const timeInvalidatorData = coder.decode("timeInvalidator", account.account.data);
            if ((_a = timeInvalidatorData.expiration) === null || _a === void 0 ? void 0 : _a.lte(new anchor_1.BN(Date.now() / 1000))) {
                expiredTimeInvalidators.push({
                    ...account,
                    parsed: timeInvalidatorData,
                });
            }
        }
        catch (e) {
            console.log(`Failed to decode time invalidator data`);
        }
    });
    return expiredTimeInvalidators;
};
exports.getExpiredTimeInvalidators = getExpiredTimeInvalidators;
const getAllTimeInvalidators = async (connection) => {
    const programAccounts = await connection.getProgramAccounts(constants_1.TIME_INVALIDATOR_ADDRESS);
    const expiredTimeInvalidators = [];
    const coder = new anchor_1.BorshAccountsCoder(constants_1.TIME_INVALIDATOR_IDL);
    programAccounts.forEach((account) => {
        try {
            const timeInvalidatorData = coder.decode("timeInvalidator", account.account.data);
            expiredTimeInvalidators.push({
                ...account,
                parsed: timeInvalidatorData,
            });
        }
        catch (e) {
            console.log(`Failed to decode time invalidator data`);
        }
    });
    return expiredTimeInvalidators;
};
exports.getAllTimeInvalidators = getAllTimeInvalidators;
//# sourceMappingURL=accounts.js.map