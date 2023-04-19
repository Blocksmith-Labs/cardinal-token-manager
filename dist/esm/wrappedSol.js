import * as BufferLayout from "@solana/buffer-layout";
import * as splToken from "@solana/spl-token";
import { SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { withFindOrInitAssociatedTokenAccount } from ".";
import { findAta } from "./utils";
export async function withWrapSol(transaction, connection, wallet, lamports, skipInitTokenAccount = false) {
    const nativeAssociatedTokenAccountId = skipInitTokenAccount
        ? await findAta(splToken.NATIVE_MINT, wallet.publicKey, true)
        : await withFindOrInitAssociatedTokenAccount(transaction, connection, splToken.NATIVE_MINT, wallet.publicKey, wallet.publicKey);
    transaction.add(SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: nativeAssociatedTokenAccountId,
        lamports,
    }));
    transaction.add(createSyncNativeInstruction(nativeAssociatedTokenAccountId));
    return transaction;
}
export function createSyncNativeInstruction(nativeAccount) {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 17, // SyncNative instruction
    }, data);
    const keys = [{ pubkey: nativeAccount, isSigner: false, isWritable: true }];
    return new TransactionInstruction({
        keys,
        programId: splToken.TOKEN_PROGRAM_ID,
        data,
    });
}
//# sourceMappingURL=wrappedSol.js.map