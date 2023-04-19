"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = exports.undelegate = exports.delegate = exports.closeTransferReceipt = exports.updateTransferReceipt = exports.createTransferReceipt = exports.invalidate = exports.claimReceiptMint = exports.closeMintManager = exports.creatMintManager = exports.createClaimReceipt = exports.claim = exports.updateInvalidationType = exports.unissue = exports.issue = exports.addInvalidator = exports.transfer = exports.setTransferAuthority = exports.setClaimApprover = exports.init = exports.initMintCounter = void 0;
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const __1 = require("../..");
const _1 = require(".");
const constants_1 = require("./constants");
const pda_1 = require("./pda");
const utils_1 = require("./utils");
const initMintCounter = async (connection, wallet, mint) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [mintCounterId, _mintCounterBump] = await (0, pda_1.findMintCounterId)(mint);
    return tokenManagerProgram.instruction.initMintCounter(mint, {
        accounts: {
            mintCounter: mintCounterId,
            payer: wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
};
exports.initMintCounter = initMintCounter;
const init = async (connection, wallet, mint, issuerTokenAccountId, amount, kind, invalidationType, numInvalidators = 1, payer) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [[tokenManagerId], [mintCounterId]] = await Promise.all([
        (0, pda_1.findTokenManagerAddress)(mint),
        (0, pda_1.findMintCounterId)(mint),
    ]);
    return [
        tokenManagerProgram.instruction.init({
            numInvalidators,
            amount,
            kind,
            invalidationType,
        }, {
            accounts: {
                tokenManager: tokenManagerId,
                mintCounter: mintCounterId,
                mint: mint,
                issuer: wallet.publicKey,
                payer: payer || wallet.publicKey,
                issuerTokenAccount: issuerTokenAccountId,
                systemProgram: web3_js_1.SystemProgram.programId,
            },
        }),
        tokenManagerId,
    ];
};
exports.init = init;
const setClaimApprover = (connection, wallet, tokenManagerId, claimApproverId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.setClaimApprover(claimApproverId, {
        accounts: {
            tokenManager: tokenManagerId,
            issuer: wallet.publicKey,
        },
    });
};
exports.setClaimApprover = setClaimApprover;
const setTransferAuthority = (connection, wallet, tokenManagerId, transferAuthorityId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.setTransferAuthority(transferAuthorityId, {
        accounts: {
            tokenManager: tokenManagerId,
            issuer: wallet.publicKey,
        },
    });
};
exports.setTransferAuthority = setTransferAuthority;
const transfer = (connection, wallet, tokenManagerId, mint, currentHolderTokenAccountId, recipient, recipientTokenAccountId, remainingAcounts) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.transfer({
        accounts: {
            tokenManager: tokenManagerId,
            mint: mint,
            currentHolderTokenAccount: currentHolderTokenAccountId,
            recipient: recipient,
            recipientTokenAccount: recipientTokenAccountId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
        remainingAccounts: remainingAcounts ? remainingAcounts : [],
    });
};
exports.transfer = transfer;
const addInvalidator = (connection, wallet, tokenManagerId, invalidatorId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.addInvalidator(invalidatorId, {
        accounts: {
            tokenManager: tokenManagerId,
            issuer: wallet.publicKey,
        },
    });
};
exports.addInvalidator = addInvalidator;
const issue = (connection, wallet, tokenManagerId, tokenManagerTokenAccountId, issuerTokenAccountId, payer = wallet.publicKey, remainingAccounts) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.issue({
        accounts: {
            tokenManager: tokenManagerId,
            tokenManagerTokenAccount: tokenManagerTokenAccountId,
            issuer: wallet.publicKey,
            issuerTokenAccount: issuerTokenAccountId,
            payer: payer,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
        remainingAccounts: remainingAccounts !== null && remainingAccounts !== void 0 ? remainingAccounts : [],
    });
};
exports.issue = issue;
const unissue = (connection, wallet, tokenManagerId, tokenManagerTokenAccountId, issuerTokenAccountId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.unissue({
        accounts: {
            tokenManager: tokenManagerId,
            tokenManagerTokenAccount: tokenManagerTokenAccountId,
            issuer: wallet.publicKey,
            issuerTokenAccount: issuerTokenAccountId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
};
exports.unissue = unissue;
const updateInvalidationType = (connection, wallet, tokenManagerId, invalidationType) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.updateInvalidationType(invalidationType, {
        accounts: {
            tokenManager: tokenManagerId,
            issuer: wallet.publicKey,
        },
    });
};
exports.updateInvalidationType = updateInvalidationType;
const claim = async (connection, wallet, tokenManagerId, tokenManagerKind, mintId, tokenManagerTokenAccountId, recipientTokenAccountId, claimReceipt) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const remainingAccounts = await (0, utils_1.getRemainingAccountsForKind)(mintId, tokenManagerKind);
    return tokenManagerProgram.instruction.claim({
        accounts: {
            tokenManager: tokenManagerId,
            tokenManagerTokenAccount: tokenManagerTokenAccountId,
            mint: mintId,
            recipient: wallet.publicKey,
            recipientTokenAccount: recipientTokenAccountId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
        remainingAccounts: claimReceipt
            ? [
                ...remainingAccounts,
                { pubkey: claimReceipt, isSigner: false, isWritable: true },
            ]
            : remainingAccounts,
    });
};
exports.claim = claim;
const createClaimReceipt = async (connection, wallet, tokenManagerId, claimApproverId, payer = wallet.publicKey, target = wallet.publicKey) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [claimReceiptId] = await (0, pda_1.findClaimReceiptId)(tokenManagerId, target);
    return [
        tokenManagerProgram.instruction.createClaimReceipt(target, {
            accounts: {
                tokenManager: tokenManagerId,
                claimApprover: claimApproverId,
                claimReceipt: claimReceiptId,
                payer,
                systemProgram: web3_js_1.SystemProgram.programId,
            },
        }),
        claimReceiptId,
    ];
};
exports.createClaimReceipt = createClaimReceipt;
const creatMintManager = async (connection, wallet, mintId, payer = wallet.publicKey) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [mintManagerId, _mintManagerBump] = await (0, pda_1.findMintManagerId)(mintId);
    return [
        tokenManagerProgram.instruction.createMintManager({
            accounts: {
                mintManager: mintManagerId,
                mint: mintId,
                freezeAuthority: wallet.publicKey,
                payer: payer,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
            },
        }),
        mintManagerId,
    ];
};
exports.creatMintManager = creatMintManager;
const closeMintManager = async (connection, wallet, mintId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [mintManagerId] = await (0, pda_1.findMintManagerId)(mintId);
    return [
        tokenManagerProgram.instruction.closeMintManager({
            accounts: {
                mintManager: mintManagerId,
                mint: mintId,
                freezeAuthority: wallet.publicKey,
                payer: wallet.publicKey,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        }),
        mintManagerId,
    ];
};
exports.closeMintManager = closeMintManager;
const claimReceiptMint = async (connection, wallet, name, tokenManagerId, receiptMintId, payer = wallet.publicKey) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [receiptMintMetadataId, recipientTokenAccountId, [receiptMintManagerId],] = await Promise.all([
        mpl_token_metadata_1.Metadata.getPDA(receiptMintId),
        (0, __1.findAta)(receiptMintId, wallet.publicKey),
        (0, pda_1.findReceiptMintManagerId)(),
    ]);
    return tokenManagerProgram.instruction.claimReceiptMint(name, {
        accounts: {
            tokenManager: tokenManagerId,
            receiptMint: receiptMintId,
            receiptMintMetadata: receiptMintMetadataId,
            recipientTokenAccount: recipientTokenAccountId,
            issuer: wallet.publicKey,
            payer: payer,
            receiptMintManager: receiptMintManagerId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedToken: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenMetadataProgram: mpl_token_metadata_1.MetadataProgram.PUBKEY,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        },
    });
};
exports.claimReceiptMint = claimReceiptMint;
const invalidate = async (connection, wallet, mintId, tokenManagerId, tokenManagerKind, tokenManagerState, tokenManagerTokenAccountId, recipientTokenAccountId, returnAccounts) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const transferAccounts = await (0, utils_1.getRemainingAccountsForKind)(mintId, tokenManagerKind);
    return tokenManagerProgram.instruction.invalidate({
        accounts: {
            tokenManager: tokenManagerId,
            tokenManagerTokenAccount: tokenManagerTokenAccountId,
            mint: mintId,
            recipientTokenAccount: recipientTokenAccountId,
            invalidator: wallet.publicKey,
            collector: _1.CRANK_KEY,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        },
        remainingAccounts: [
            ...(tokenManagerState === _1.TokenManagerState.Claimed
                ? transferAccounts
                : []),
            ...returnAccounts,
        ],
    });
};
exports.invalidate = invalidate;
const createTransferReceipt = async (connection, wallet, tokenManagerId, target, payer) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [transferReceiptId] = await (0, pda_1.findTransferReceiptId)(tokenManagerId);
    return [
        tokenManagerProgram.instruction.createTransferReceipt(target, {
            accounts: {
                tokenManager: tokenManagerId,
                transferAuthority: wallet.publicKey,
                transferReceipt: transferReceiptId,
                payer: payer !== null && payer !== void 0 ? payer : wallet.publicKey,
                systemProgram: web3_js_1.SystemProgram.programId,
            },
        }),
        transferReceiptId,
    ];
};
exports.createTransferReceipt = createTransferReceipt;
const updateTransferReceipt = async (connection, wallet, tokenManagerId, target) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [transferReceiptId] = await (0, pda_1.findTransferReceiptId)(tokenManagerId);
    return [
        tokenManagerProgram.instruction.updateTransferReceipt(target, {
            accounts: {
                tokenManager: tokenManagerId,
                transferAuthority: wallet.publicKey,
                transferReceipt: transferReceiptId,
            },
        }),
        transferReceiptId,
    ];
};
exports.updateTransferReceipt = updateTransferReceipt;
const closeTransferReceipt = async (connection, wallet, tokenManagerId, reipient) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    const [transferReceiptId] = await (0, pda_1.findTransferReceiptId)(tokenManagerId);
    return [
        tokenManagerProgram.instruction.closeTransferReceipt({
            accounts: {
                tokenManager: tokenManagerId,
                transferAuthority: wallet.publicKey,
                transferReceipt: transferReceiptId,
                recipient: reipient !== null && reipient !== void 0 ? reipient : wallet.publicKey,
            },
        }),
        transferReceiptId,
    ];
};
exports.closeTransferReceipt = closeTransferReceipt;
const delegate = (connection, wallet, mintId, tokenManagerId, mintManagerId, recipient, recipientTokenAccountId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.delegate({
        accounts: {
            tokenManager: tokenManagerId,
            mint: mintId,
            mintManager: mintManagerId,
            recipient: recipient,
            recipientTokenAccount: recipientTokenAccountId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
};
exports.delegate = delegate;
const undelegate = (connection, wallet, mintId, tokenManagerId, mintManagerId, recipient, recipientTokenAccountId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.undelegate({
        accounts: {
            tokenManager: tokenManagerId,
            mint: mintId,
            mintManager: mintManagerId,
            recipient: recipient,
            recipientTokenAccount: recipientTokenAccountId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
};
exports.undelegate = undelegate;
const send = (connection, wallet, mintId, tokenManagerId, mintManagerId, recipient, recipientTokenAccountId, target, targetTokenAccountId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const tokenManagerProgram = new anchor_1.Program(constants_1.TOKEN_MANAGER_IDL, constants_1.TOKEN_MANAGER_ADDRESS, provider);
    return tokenManagerProgram.instruction.send({
        accounts: {
            tokenManager: tokenManagerId,
            mint: mintId,
            mintManager: mintManagerId,
            recipient: recipient,
            recipientTokenAccount: recipientTokenAccountId,
            target: target,
            targetTokenAccount: targetTokenAccountId,
            payer: wallet.publicKey,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
        },
    });
};
exports.send = send;
//# sourceMappingURL=instruction.js.map