import { AnchorProvider, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import { CRANK_KEY } from "../tokenManager";
import { PAYMENT_MANAGER_ADDRESS, PAYMENT_MANAGER_IDL } from ".";
import { findPaymentManagerAddress } from "./pda";
export const init = async (connection, wallet, name, params) => {
    var _a;
    const provider = new AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new Program(PAYMENT_MANAGER_IDL, PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await findPaymentManagerAddress(name);
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
                systemProgram: SystemProgram.programId,
            },
        }),
        paymentManagerId,
    ];
};
export const managePayment = async (connection, wallet, name, params) => {
    const provider = new AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new Program(PAYMENT_MANAGER_IDL, PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await findPaymentManagerAddress(name);
    return paymentManagerProgram.instruction.managePayment(params.paymentAmount, {
        accounts: {
            paymentManager: paymentManagerId,
            payerTokenAccount: params.payerTokenAccount,
            feeCollectorTokenAccount: params.feeCollectorTokenAccount,
            paymentTokenAccount: params.paymentTokenAccount,
            payer: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
    });
};
export const handlePaymentWithRoyalties = async (connection, wallet, name, params) => {
    const provider = new AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new Program(PAYMENT_MANAGER_IDL, PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await findPaymentManagerAddress(name);
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
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        remainingAccounts: params.royaltiesRemainingAccounts,
    });
};
export const close = async (connection, wallet, name, collector) => {
    const provider = new AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new Program(PAYMENT_MANAGER_IDL, PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await findPaymentManagerAddress(name);
    return paymentManagerProgram.instruction.close({
        accounts: {
            paymentManager: paymentManagerId,
            collector: collector || CRANK_KEY,
            closer: wallet.publicKey,
        },
    });
};
export const update = async (connection, wallet, name, params) => {
    var _a;
    const provider = new AnchorProvider(connection, wallet, {});
    const paymentManagerProgram = new Program(PAYMENT_MANAGER_IDL, PAYMENT_MANAGER_ADDRESS, provider);
    const [paymentManagerId] = await findPaymentManagerAddress(name);
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
                systemProgram: SystemProgram.programId,
            },
        }),
        paymentManagerId,
    ];
};
//# sourceMappingURL=instruction.js.map