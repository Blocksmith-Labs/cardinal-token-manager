import { AnchorProvider, BorshAccountsCoder, Program, } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair } from "@solana/web3.js";
import { CLAIM_APPROVER_ADDRESS, CLAIM_APPROVER_IDL } from "./constants";
import { findClaimApproverAddress } from "./pda";
export const getClaimApprover = async (connection, tokenManagerId) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const claimApproverProgram = new Program(CLAIM_APPROVER_IDL, CLAIM_APPROVER_ADDRESS, provider);
    const [claimApproverId] = await findClaimApproverAddress(tokenManagerId);
    const parsed = await claimApproverProgram.account.paidClaimApprover.fetch(claimApproverId);
    return {
        parsed,
        pubkey: claimApproverId,
    };
};
export const getClaimApprovers = async (connection, claimApproverIds) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const claimApproverProgram = new Program(CLAIM_APPROVER_IDL, CLAIM_APPROVER_ADDRESS, provider);
    let claimApprovers = [];
    try {
        claimApprovers =
            (await claimApproverProgram.account.paidClaimApprover.fetchMultiple(claimApproverIds));
    }
    catch (e) {
        console.log(e);
    }
    return claimApprovers.map((tm, i) => ({
        parsed: tm,
        pubkey: claimApproverIds[i],
    }));
};
export const getAllClaimApprovers = async (connection) => {
    const programAccounts = await connection.getProgramAccounts(CLAIM_APPROVER_ADDRESS);
    const claimApprovers = [];
    const coder = new BorshAccountsCoder(CLAIM_APPROVER_IDL);
    programAccounts.forEach((account) => {
        try {
            const claimApproverData = coder.decode("paidClaimApprover", account.account.data);
            claimApprovers.push({
                ...account,
                parsed: claimApproverData,
            });
        }
        catch (e) {
            console.log(`Failed to decode claim approver data`);
        }
    });
    return claimApprovers;
};
//# sourceMappingURL=accounts.js.map