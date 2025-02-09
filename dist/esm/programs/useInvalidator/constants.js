import { emptyWallet } from "@cardinal/common";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as USE_INVALIDATOR_TYPES from "../../idl/cardinal_use_invalidator";
export const USE_INVALIDATOR_ADDRESS = new PublicKey(
  "t5DEoCV1arWsMSCurX19CpFASKVyqrvvvDmFvWiGLoE"
);
export const USE_INVALIDATOR_SEED = "use-invalidator";
export const USE_INVALIDATOR_IDL = USE_INVALIDATOR_TYPES.IDL;
export const useInvalidatorProgram = (connection, wallet, confirmOptions) => {
  return new Program(
    USE_INVALIDATOR_IDL,
    USE_INVALIDATOR_ADDRESS,
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
