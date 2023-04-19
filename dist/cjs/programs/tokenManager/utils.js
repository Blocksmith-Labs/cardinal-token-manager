"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemainingAccountsForTransfer = exports.withRemainingAccountsForHandlePaymentWithRoyalties = exports.withRemainingAccountsForReturn = exports.withRemainingAccountsForPayment = exports.getRemainingAccountsForKind = void 0;
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const __1 = require("../..");
const utils_1 = require("../../utils");
const accounts_1 = require("../paymentManager/accounts");
const _1 = require(".");
const pda_1 = require("./pda");
const getRemainingAccountsForKind = async (mintId, tokenManagerKind) => {
    if (tokenManagerKind === _1.TokenManagerKind.Managed ||
        tokenManagerKind === _1.TokenManagerKind.Permissioned) {
        const [mintManagerId] = await (0, pda_1.findMintManagerId)(mintId);
        return [
            {
                pubkey: mintManagerId,
                isSigner: false,
                isWritable: true,
            },
        ];
    }
    else if (tokenManagerKind === _1.TokenManagerKind.Edition) {
        const editionId = await mpl_token_metadata_1.Edition.getPDA(mintId);
        return [
            {
                pubkey: editionId,
                isSigner: false,
                isWritable: false,
            },
            {
                pubkey: mpl_token_metadata_1.MetadataProgram.PUBKEY,
                isSigner: false,
                isWritable: false,
            },
        ];
    }
    else {
        return [];
    }
};
exports.getRemainingAccountsForKind = getRemainingAccountsForKind;
const withRemainingAccountsForPayment = async (transaction, connection, wallet, mint, paymentMint, issuerId, paymentManagerId, options) => {
    var _a, _b;
    const payer = (_a = options === null || options === void 0 ? void 0 : options.payer) !== null && _a !== void 0 ? _a : wallet.publicKey;
    const royaltiesRemainingAccounts = await (0, exports.withRemainingAccountsForHandlePaymentWithRoyalties)(transaction, connection, wallet, mint, paymentMint, [issuerId.toString()]);
    const mintMetadataId = await mpl_token_metadata_1.Metadata.getPDA(mint);
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
        const receiptMintToken = new spl_token_1.Token(connection, options.receiptMint, spl_token_1.TOKEN_PROGRAM_ID, web3_js_1.Keypair.generate());
        const receiptTokenAccount = await receiptMintToken.getAccountInfo(receiptTokenAccountId);
        // get ATA for this mint of receipt mint holder
        const returnTokenAccountId = receiptTokenAccount.owner.equals(wallet.publicKey)
            ? await (0, __1.findAta)(paymentMint, receiptTokenAccount.owner, true)
            : await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, paymentMint, receiptTokenAccount.owner, payer, true);
        const paymentManager = await (0, utils_1.tryGetAccount)(() => (0, accounts_1.getPaymentManager)(connection, paymentManagerId));
        const feeCollectorTokenAccountId = await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, paymentMint, paymentManager ? paymentManager.parsed.feeCollector : paymentManagerId, payer, true);
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
            ? await (0, __1.findAta)(paymentMint, issuerId, true)
            : await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, paymentMint, issuerId, payer, true);
        const paymentManager = await (0, utils_1.tryGetAccount)(() => (0, accounts_1.getPaymentManager)(connection, paymentManagerId));
        const feeCollectorTokenAccountId = await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, paymentMint, paymentManager ? paymentManager.parsed.feeCollector : paymentManagerId, payer, true);
        return [
            issuerTokenAccountId,
            feeCollectorTokenAccountId,
            [...paymentRemainingAccounts, ...royaltiesRemainingAccounts],
        ];
    }
};
exports.withRemainingAccountsForPayment = withRemainingAccountsForPayment;
const withRemainingAccountsForReturn = async (transaction, connection, wallet, tokenManagerData, allowOwnerOffCurve = true) => {
    var _a;
    const { issuer, mint, claimApprover, invalidationType, receiptMint, state } = tokenManagerData.parsed;
    if (invalidationType === _1.InvalidationType.Vest &&
        state === _1.TokenManagerState.Issued) {
        if (!claimApprover)
            throw "Claim approver must be set";
        const claimApproverTokenAccountId = await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, mint, claimApprover, wallet.publicKey, allowOwnerOffCurve);
        return [
            {
                pubkey: claimApproverTokenAccountId,
                isSigner: false,
                isWritable: true,
            },
        ];
    }
    else if (invalidationType === _1.InvalidationType.Return ||
        state === _1.TokenManagerState.Issued) {
        if (receiptMint) {
            const receiptMintLargestAccount = await connection.getTokenLargestAccounts(receiptMint);
            // get holder of receipt mint
            const receiptTokenAccountId = (_a = receiptMintLargestAccount.value[0]) === null || _a === void 0 ? void 0 : _a.address;
            if (!receiptTokenAccountId)
                throw new Error("No token accounts found");
            const receiptMintToken = new spl_token_1.Token(connection, receiptMint, spl_token_1.TOKEN_PROGRAM_ID, web3_js_1.Keypair.generate());
            const receiptTokenAccount = await receiptMintToken.getAccountInfo(receiptTokenAccountId);
            // get ATA for this mint of receipt mint holder
            const returnTokenAccountId = await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, mint, receiptTokenAccount.owner, wallet.publicKey, allowOwnerOffCurve);
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
            const issuerTokenAccountId = await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, mint, issuer, wallet.publicKey, allowOwnerOffCurve);
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
exports.withRemainingAccountsForReturn = withRemainingAccountsForReturn;
const withRemainingAccountsForHandlePaymentWithRoyalties = async (transaction, connection, wallet, mint, paymentMint, excludeCreators) => {
    const creatorsRemainingAccounts = [];
    const mintMetadataId = await mpl_token_metadata_1.Metadata.getPDA(mint);
    const accountInfo = await connection.getAccountInfo(mintMetadataId);
    let metaplexMintData;
    try {
        metaplexMintData = mpl_token_metadata_1.MetadataData.deserialize(accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.data);
    }
    catch (e) {
        return [];
    }
    if (metaplexMintData.data.creators) {
        for (const creator of metaplexMintData.data.creators) {
            if (creator.share !== 0) {
                const creatorAddress = new web3_js_1.PublicKey(creator.address);
                const creatorMintTokenAccount = (excludeCreators === null || excludeCreators === void 0 ? void 0 : excludeCreators.includes(creator.address.toString()))
                    ? await (0, __1.findAta)(paymentMint, creatorAddress, true)
                    : await (0, __1.withFindOrInitAssociatedTokenAccount)(transaction, connection, paymentMint, creatorAddress, wallet.publicKey, true);
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
exports.withRemainingAccountsForHandlePaymentWithRoyalties = withRemainingAccountsForHandlePaymentWithRoyalties;
const getRemainingAccountsForTransfer = async (transferAuthority, tokenManagerId) => {
    if (transferAuthority) {
        const [transferReceiptId] = await (0, pda_1.findTransferReceiptId)(tokenManagerId);
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
exports.getRemainingAccountsForTransfer = getRemainingAccountsForTransfer;
//# sourceMappingURL=utils.js.map