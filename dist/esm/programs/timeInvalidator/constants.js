import { emptyWallet } from "@cardinal/common";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as TIME_INVALIDATOR_TYPES from "../../idl/cardinal_time_invalidator";
export const TIME_INVALIDATOR_ADDRESS = new PublicKey(
  "t3JAC837E6YLkJSdz3UZLUZVhLBShZh727c9TRbwUKK"
);
export const TIME_INVALIDATOR_SEED = "time-invalidator";
export const TIME_INVALIDATOR_IDL = TIME_INVALIDATOR_TYPES.IDL;
export const timeInvalidatorProgram = (connection, wallet, confirmOptions) => {
  return new Program(
    TIME_INVALIDATOR_IDL,
    TIME_INVALIDATOR_ADDRESS,
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
