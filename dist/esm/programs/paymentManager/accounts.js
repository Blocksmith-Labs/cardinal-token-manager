import { AnchorProvider, BorshAccountsCoder, Program, } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair } from "@solana/web3.js";
import { PAYMENT_MANAGER_ADDRESS, PAYMENT_MANAGER_IDL } from ".";
export const getPaymentManager = async (connection, paymentManagerId) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const paymentManagerProgram = new Program(PAYMENT_MANAGER_IDL, PAYMENT_MANAGER_ADDRESS, provider);
    const parsed = await paymentManagerProgram.account.paymentManager.fetch(paymentManagerId);
    return {
        parsed,
        pubkey: paymentManagerId,
    };
};
export const getPaymentManagers = async (connection, paymentManagerIds) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const paymentManagerProgram = new Program(PAYMENT_MANAGER_IDL, PAYMENT_MANAGER_ADDRESS, provider);
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
export const getAllPaymentManagers = async (connection) => {
    const programAccounts = await connection.getProgramAccounts(PAYMENT_MANAGER_ADDRESS);
    const paymentManagers = [];
    const coder = new BorshAccountsCoder(PAYMENT_MANAGER_IDL);
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
//# sourceMappingURL=accounts.js.map