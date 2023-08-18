import { emptyWallet } from "@cardinal/common";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as CLAIM_APPROVER_TYPES from "../../idl/cardinal_paid_claim_approver";
import { DEFAULT_PAYMENT_MANAGER_NAME } from "../paymentManager";
import { findPaymentManagerAddress } from "../paymentManager/pda";
export const CLAIM_APPROVER_ADDRESS = new PublicKey("4ZtHLgmEHpsNejeduUJwEmpXLv1vZMcoFbJUEus9BGL8");
export const CLAIM_APPROVER_SEED = "paid-claim-approver";
export const CLAIM_APPROVER_IDL = CLAIM_APPROVER_TYPES.IDL;
export const defaultPaymentManagerId = findPaymentManagerAddress(DEFAULT_PAYMENT_MANAGER_NAME);
export const claimApproverProgram = (connection, wallet, confirmOptions) => {
    return new Program(CLAIM_APPROVER_IDL, CLAIM_APPROVER_ADDRESS, new AnchorProvider(connection, wallet !== null && wallet !== void 0 ? wallet : emptyWallet(Keypair.generate().publicKey), confirmOptions !== null && confirmOptions !== void 0 ? confirmOptions : {}));
};
//# sourceMappingURL=constants.js.map