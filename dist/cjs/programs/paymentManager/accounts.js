"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPaymentManagers = exports.getPaymentManagers = exports.getPaymentManager = void 0;
const anchor_1 = require("@project-serum/anchor");
const solana_contrib_1 = require("@saberhq/solana-contrib");
const web3_js_1 = require("@solana/web3.js");
const _1 = require(".");
const getPaymentManager = async (connection, paymentManagerId) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const paymentManagerProgram = new anchor_1.Program(_1.PAYMENT_MANAGER_IDL, _1.PAYMENT_MANAGER_ADDRESS, provider);
    const parsed = await paymentManagerProgram.account.paymentManager.fetch(paymentManagerId);
    return {
        parsed,
        pubkey: paymentManagerId,
    };
};
exports.getPaymentManager = getPaymentManager;
const getPaymentManagers = async (connection, paymentManagerIds) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const paymentManagerProgram = new anchor_1.Program(_1.PAYMENT_MANAGER_IDL, _1.PAYMENT_MANAGER_ADDRESS, provider);
    let paymentManagers = [];
    try {
        paymentManagers =
            (await paymentManagerProgram.account.paymentManager.fetchMultiple(paymentManagerIds));
    }
    catch (e) {
        //
    }
    return paymentManagers.reduce((acc, tm, i) => tm ? [...acc, { parsed: tm, pubkey: paymentManagerIds[i] }] : acc, []);
};
exports.getPaymentManagers = getPaymentManagers;
const getAllPaymentManagers = async (connection) => {
    const programAccounts = await connection.getProgramAccounts(_1.PAYMENT_MANAGER_ADDRESS);
    const paymentManagers = [];
    const coder = new anchor_1.BorshAccountsCoder(_1.PAYMENT_MANAGER_IDL);
    programAccounts.forEach((account) => {
        try {
            const paymentManagerData = coder.decode("paymentManager", account.account.data);
            paymentManagers.push({
                ...account,
                parsed: paymentManagerData,
            });
        }
        catch (e) {
            //
        }
    });
    return paymentManagers;
};
exports.getAllPaymentManagers = getAllPaymentManagers;
//# sourceMappingURL=accounts.js.map