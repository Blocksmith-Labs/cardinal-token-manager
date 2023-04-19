import { Edition, Metadata, MetadataData, MetadataProgram, } from "@metaplex-foundation/mpl-token-metadata";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { findAta, withFindOrInitAssociatedTokenAccount } from "../..";
import { tryGetAccount } from "../../utils";
import { getPaymentManager } from "../paymentManager/accounts";
import { InvalidationType, TokenManagerKind, TokenManagerState } from ".";
import { findMintManagerId, findTransferReceiptId } from "./pda";
export const getRemainingAccountsForKind = async (mintId, tokenManagerKind) => {
    if (tokenManagerKind === TokenManagerKind.Managed ||
        tokenManagerKind === TokenManagerKind.Permissioned) {
        const [mintManagerId] = await findMintManagerId(mintId);
        return [
            {
                pubkey: mintManagerId,
                isSigner: false,
                isWritable: true,
            },
        ];
    }
    else if (tokenManagerKind === TokenManagerKind.Edition) {
        const editionId = await Edition.getPDA(mintId);
        return [
            {
                pubkey: editionId,
                isSigner: false,
                isWritable: false,
            },
            {
                pubkey: MetadataProgram.PUBKEY,
                isSigner: false,
                isWritable: false,
            },
        ];
    }
    else {
        return [];
    }
};
export const withRemainingAccountsForPayment = async (transaction, connection, wallet, mint, paymentMint, issuerId, paymentManagerId, options) => {
    var _a, _b;
    const payer = (_a = options === null || options === void 0 ? void 0 : options.payer) !== null && _a !== void 0 ? _a : wallet.publicKey;
    const royaltiesRemainingAccounts = await withRemainingAccountsForHandlePaymentWithRoyalties(transaction, connection, wallet, mint, paymentMint, [issuerId.toString()]);
    const mintMetadataId = await Metadata.getPDA(mint);
    const paymentRemainingAccounts = [
        {
            pubkey: paymentMint,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: mint,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: mintMetadataId,
            isSigner: false,
            isWritable: true,
        },
    ];
    if (options === null || options === void 0 ? void 0 : options.receiptMint) {
        const receiptMintLargestAccount = await connection.getTokenLargestAccounts(options.receiptMint);
        // get holder of receipt mint
        const receiptTokenAccountId = (_b = receiptMintLargestAccount.value[0]) === null || _b === void 0 ? void 0 : _b.address;
        if (!receiptTokenAccountId)
            throw new Error("No token accounts found");
        const receiptMintToken = new Token(connection, options.receiptMint, TOKEN_PROGRAM_ID, Keypair.generate());
        const receiptTokenAccount = await receiptMintToken.getAccountInfo(receiptTokenAccountId);
        // get ATA for this mint of receipt mint holder
        const returnTokenAccountId = receiptTokenAccount.owner.equals(wallet.publicKey)
            ? await findAta(paymentMint, receiptTokenAccount.owner, true)
            : await withFindOrInitAssociatedTokenAccount(transaction, connection, paymentMint, receiptTokenAccount.owner, payer, true);
        const paymentManager = await tryGetAccount(() => getPaymentManager(connection, paymentManagerId));
        const feeCollectorTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, paymentMint, paymentManager ? paymentManager.parsed.feeCollector : paymentManagerId, payer, true);
        return [
            returnTokenAccountId,
            feeCollectorTokenAccountId,
            [
                {
                    pubkey: receiptTokenAccountId,
                    isSigner: false,
                    isWritable: true,
                },
                ...paymentRemainingAccounts,
                ...royaltiesRemainingAccounts,
            ],
        ];
    }
    else {
        const issuerTokenAccountId = issuerId.equals(wallet.publicKey)
            ? await findAta(paymentMint, issuerId, true)
            : await withFindOrInitAssociatedTokenAccount(transaction, connection, paymentMint, issuerId, payer, true);
        const paymentManager = await tryGetAccount(() => getPaymentManager(connection, paymentManagerId));
        const feeCollectorTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, paymentMint, paymentManager ? paymentManager.parsed.feeCollector : paymentManagerId, payer, true);
        return [
            issuerTokenAccountId,
            feeCollectorTokenAccountId,
            [...paymentRemainingAccounts, ...royaltiesRemainingAccounts],
        ];
    }
};
export const withRemainingAccountsForReturn = async (transaction, connection, wallet, tokenManagerData, allowOwnerOffCurve = true) => {
    var _a;
    const { issuer, mint, claimApprover, invalidationType, receiptMint, state } = tokenManagerData.parsed;
    if (invalidationType === InvalidationType.Vest &&
        state === TokenManagerState.Issued) {
        if (!claimApprover)
            throw "Claim approver must be set";
        const claimApproverTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, mint, claimApprover, wallet.publicKey, allowOwnerOffCurve);
        return [
            {
                pubkey: claimApproverTokenAccountId,
                isSigner: false,
                isWritable: true,
            },
        ];
    }
    else if (invalidationType === InvalidationType.Return ||
        state === TokenManagerState.Issued) {
        if (receiptMint) {
            const receiptMintLargestAccount = await connection.getTokenLargestAccounts(receiptMint);
            // get holder of receipt mint
            const receiptTokenAccountId = (_a = receiptMintLargestAccount.value[0]) === null || _a === void 0 ? void 0 : _a.address;
            if (!receiptTokenAccountId)
                throw new Error("No token accounts found");
            const receiptMintToken = new Token(connection, receiptMint, TOKEN_PROGRAM_ID, Keypair.generate());
            const receiptTokenAccount = await receiptMintToken.getAccountInfo(receiptTokenAccountId);
            // get ATA for this mint of receipt mint holder
            const returnTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, mint, receiptTokenAccount.owner, wallet.publicKey, allowOwnerOffCurve);
            return [
                {
                    pubkey: returnTokenAccountId,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: receiptTokenAccountId,
                    isSigner: false,
                    isWritable: true,
                },
            ];
        }
        else {
            const issuerTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, mint, issuer, wallet.publicKey, allowOwnerOffCurve);
            return [
                {
                    pubkey: issuerTokenAccountId,
                    isSigner: false,
                    isWritable: true,
                },
            ];
        }
    }
    else {
        return [];
    }
};
export const withRemainingAccountsForHandlePaymentWithRoyalties = async (transaction, connection, wallet, mint, paymentMint, excludeCreators) => {
    const creatorsRemainingAccounts = [];
    const mintMetadataId = await Metadata.getPDA(mint);
    const accountInfo = await connection.getAccountInfo(mintMetadataId);
    let metaplexMintData;
    try {
        metaplexMintData = MetadataData.deserialize(accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.data);
    }
    catch (e) {
        return [];
    }
    if (metaplexMintData.data.creators) {
        for (const creator of metaplexMintData.data.creators) {
            if (creator.share !== 0) {
                const creatorAddress = new PublicKey(creator.address);
                const creatorMintTokenAccount = (excludeCreators === null || excludeCreators === void 0 ? void 0 : excludeCreators.includes(creator.address.toString()))
                    ? await findAta(paymentMint, creatorAddress, true)
                    : await withFindOrInitAssociatedTokenAccount(transaction, connection, paymentMint, creatorAddress, wallet.publicKey, true);
                creatorsRemainingAccounts.push({
                    pubkey: creatorMintTokenAccount,
                    isSigner: false,
                    isWritable: true,
                });
            }
        }
    }
    return creatorsRemainingAccounts;
};
export const getRemainingAccountsForTransfer = async (transferAuthority, tokenManagerId) => {
    if (transferAuthority) {
        const [transferReceiptId] = await findTransferReceiptId(tokenManagerId);
        return [
            {
                pubkey: transferReceiptId,
                isSigner: false,
                isWritable: true,
            },
        ];
    }
    else {
        return [];
    }
};
//# sourceMappingURL=utils.js.map