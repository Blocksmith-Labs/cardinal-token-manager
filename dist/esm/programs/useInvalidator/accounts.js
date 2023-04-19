import { AnchorProvider, Program } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair } from "@solana/web3.js";
import { USE_INVALIDATOR_ADDRESS, USE_INVALIDATOR_IDL } from "./constants";
export const getUseInvalidator = async (connection, useInvalidatorId) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const useInvalidatorProgram = new Program(USE_INVALIDATOR_IDL, USE_INVALIDATOR_ADDRESS, provider);
    const parsed = await useInvalidatorProgram.account.useInvalidator.fetch(useInvalidatorId);
    return {
        parsed,
        pubkey: useInvalidatorId,
    };
};
export const getUseInvalidators = async (connection, useInvalidatorIds) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const useInvalidatorProgram = new Program(USE_INVALIDATOR_IDL, USE_INVALIDATOR_ADDRESS, provider);
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
//# sourceMappingURL=accounts.js.map