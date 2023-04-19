"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.close = exports.handlePaymentWithRoyalties = exports.managePayment = exports.init = void 0;
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const tokenManager_1 = require("../tokenManager");
const _1 = require(".");
const pda_1 = require("./pda");
const init = async (connection, wallet, name, params) => {
    var _a;
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new anchor_1.Program(_1.PAYMENT_MANAGER_IDL, _1.PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await (0, pda_1.findPaymentManagerAddress)(name);
    return [
        paymentManagerProgram.instruction.init({
            name: name,
            feeCollector: params.feeCollector,
            makerFeeBasisPoints: params.makerFeeBasisPoints,
            takerFeeBasisPoints: params.takerFeeBasisPoints,
            includeSellerFeeBasisPoints: params.includeSellerFeeBasisPoints,
            royaltyFeeShare: (_a = params.royaltyFeeShare) !== null && _a !== void 0 ? _a : null,
        }, {
            accounts: {
                paymentManager: paymentManagerId,
                authority: params.authority || wallet.publicKey,
                payer: wallet.publicKey,
                systemProgram: web3_js_1.SystemProgram.programId,
            },
        }),
        paymentManagerId,
    ];
};
exports.init = init;
const managePayment = async (connection, wallet, name, params) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new anchor_1.Program(_1.PAYMENT_MANAGER_IDL, _1.PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await (0, pda_1.findPaymentManagerAddress)(name);
    return paymentManagerProgram.instruction.managePayment(params.paymentAmount, {
        accounts: {
            paymentManager: paymentManagerId,
            payerTokenAccount: params.payerTokenAccount,
            feeCollectorTokenAccount: params.feeCollectorTokenAccount,
            paymentTokenAccount: params.paymentTokenAccount,
            payer: wallet.publicKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
};
exports.managePayment = managePayment;
const handlePaymentWithRoyalties = async (connection, wallet, name, params) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new anchor_1.Program(_1.PAYMENT_MANAGER_IDL, _1.PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await (0, pda_1.findPaymentManagerAddress)(name);
    return paymentManagerProgram.instruction.handlePaymentWithRoyalties(params.paymentAmount, {
        accounts: {
            paymentManager: paymentManagerId,
            payerTokenAccount: params.payerTokenAccount,
            feeCollectorTokenAccount: params.feeCollectorTokenAccount,
            paymentTokenAccount: params.paymentTokenAccount,
            paymentMint: params.paymentMint,
            mint: params.mint,
            mintMetadata: params.mintMetadata,
            payer: wallet.publicKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
        remainingAccounts: params.royaltiesRemainingAccounts,
    });
};
exports.handlePaymentWithRoyalties = handlePaymentWithRoyalties;
const close = async (connection, wallet, name, collector) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new anchor_1.Program(_1.PAYMENT_MANAGER_IDL, _1.PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await (0, pda_1.findPaymentManagerAddress)(name);
    return paymentManagerProgram.instruction.close({
        accounts: {
            paymentManager: paymentManagerId,
            collector: collector || tokenManager_1.CRANK_KEY,
            closer: wallet.publicKey,
        },
    });
};
exports.close = close;
const update = async (connection, wallet, name, params) => {
    var _a;
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new anchor_1.Program(_1.PAYMENT_MANAGER_IDL, _1.PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await (0, pda_1.findPaymentManagerAddress)(name);
    return [
        paymentManagerProgram.instruction.update({
            authority: params.authority,
            feeCollector: params.feeCollector,
            makerFeeBasisPoints: params.makerFeeBasisPoints,
            takerFeeBasisPoints: params.takerFeeBasisPoints,
            royaltyFeeShare: (_a = params.royaltyFeeShare) !== null && _a !== void 0 ? _a : null,
        }, {
            accounts: {
                paymentManager: paymentManagerId,
                payer: wallet.publicKey,
                systemProgram: web3_js_1.SystemProgram.programId,
            },
        }),
        paymentManagerId,
    ];
};
exports.update = update;
//# sourceMappingURL=instruction.js.map