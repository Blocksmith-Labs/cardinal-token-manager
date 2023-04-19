import type { AnchorTypes } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";

import * as CLAIM_APPROVER_TYPES from "../../idl/cardinal_paid_claim_approver";

export const CLAIM_APPROVER_ADDRESS = new PublicKey(
  "4MD5VTfXNDN7Z4qzJ5Puet6ZCRgqrfnc8mzosNkviRAW"
);

export const CLAIM_APPROVER_SEED = "paid-claim-approver";

export const CLAIM_APPROVER_IDL = CLAIM_APPROVER_TYPES.IDL;

export type CLAIM_APPROVER_PROGRAM =
  CLAIM_APPROVER_TYPES.CardinalPaidClaimApprover;

export type ClaimApproverTypes = AnchorTypes<
  CLAIM_APPROVER_PROGRAM,
  {
    tokenManager: PaidClaimApproverData;
  }
>;

type Accounts = ClaimApproverTypes["Accounts"];
export type PaidClaimApproverData = Accounts["paidClaimApprover"];
