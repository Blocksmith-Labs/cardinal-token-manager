import { emptyWallet } from "@cardinal/common";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as TRANSFER_AUTHORITY_TYPES from "../../idl/cardinal_transfer_authority";
export const TRANSFER_AUTHORITY_ADDRESS = new PublicKey(
  "t7UND4Dhg8yoykPAr1WjwfZhfHDwXih5RY8voM47FMS"
);
export const TRANSFER_AUTHORITY_SEED = "transfer-authority";
export const MARKETPLACE_SEED = "marketplace";
export const LISTING_SEED = "listing";
export const TRANSFER_SEED = "transfer";
export const TRANSFER_AUTHORITY_IDL = TRANSFER_AUTHORITY_TYPES.IDL;
export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export const DEFAULT_TRANSFER_AUTHORITY_NAME = "global";
export const transferAuthorityProgram = (
  connection,
  wallet,
  confirmOptions
) => {
  return new Program(
    TRANSFER_AUTHORITY_IDL,
    TRANSFER_AUTHORITY_ADDRESS,
    new AnchorProvider(
      connection,
      wallet !== null && wallet !== void 0
        ? wallet
        : emptyWallet(Keypair.generate().publicKey),
      confirmOptions !== null && confirmOptions !== void 0 ? confirmOptions : {}
    )
  );
};
//# sourceMappingURL=constants.js.map
