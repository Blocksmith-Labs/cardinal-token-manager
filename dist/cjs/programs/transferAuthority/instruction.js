"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.release = exports.acceptTransfer = exports.cancelTransfer = exports.initTransfer = exports.whitelistMarkeplaces = exports.acceptListing = exports.removeListing = exports.updateListing = exports.createListing = exports.updateMarketplace = exports.initMarketplace = exports.updateTransferAuthority = exports.initTransferAuthority = void 0;
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const paymentManager_1 = require("../paymentManager");
const tokenManager_1 = require("../tokenManager");
const pda_1 = require("../tokenManager/pda");
const constants_1 = require("./constants");
const initTransferAuthority = (connection, wallet, name, transferAuthorityId, authorityId, payer = wallet.publicKey, allowedMarketplaces) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.initTransferAuthority({
        name: name,
        authority: authorityId,
        allowedMarketplaces: allowedMarketplaces || null,
    }, {
        accounts: {
            transferAuthority: transferAuthorityId,
            payer: payer,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
};
exports.initTransferAuthority = initTransferAuthority;
const updateTransferAuthority = (connection, wallet, transferAuthorityId, authority, allowedMarketplaces) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.updateTransferAuthority({
        authority: authority,
        allowedMarketplaces: allowedMarketplaces !== null && allowedMarketplaces !== void 0 ? allowedMarketplaces : null,
    }, {
        accounts: {
            transferAuthority: transferAuthorityId,
            authority: wallet.publicKey,
        },
    });
};
exports.updateTransferAuthority = updateTransferAuthority;
const initMarketplace = (connection, wallet, name, marketplaceId, transferAuthority, paymentManager, paymentMints, payer = wallet.publicKey) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.initMarketplace({
        name: name,
        paymentManager: paymentManager,
        authority: provider.wallet.publicKey,
        paymentMints: paymentMints || null,
        transferAuthority: transferAuthority,
    }, {
        accounts: {
            marketplace: marketplaceId,
            payer: payer,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
};
exports.initMarketplace = initMarketplace;
const updateMarketplace = (connection, wallet, marketplace, transferAuthority, paymentManager, authority, paymentMints) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.updateMarketplace({
        transferAuthority: transferAuthority,
        paymentManager: paymentManager,
        authority: authority,
        paymentMints: paymentMints !== null && paymentMints !== void 0 ? paymentMints : null,
    }, {
        accounts: {
            marketplace: marketplace,
            authority: provider.wallet.publicKey,
        },
    });
};
exports.updateMarketplace = updateMarketplace;
const createListing = async (connection, wallet, listingId, mintId, transferAuthorityId, tokenManagerId, marketplaceId, listerTokenAccount, paymentAmount, paymentMint, payer = wallet.publicKey) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const [mintManagerId] = await (0, pda_1.findMintManagerId)(mintId);
    return transferAuthorityProgram.instruction.createListing({
        paymentAmount: paymentAmount,
        paymentMint: paymentMint,
    }, {
        accounts: {
            listing: listingId,
            tokenManager: tokenManagerId,
            transferAuthority: transferAuthorityId,
            marketplace: marketplaceId,
            listerTokenAccount: listerTokenAccount,
            lister: wallet.publicKey,
            mint: mintId,
            mintManager: mintManagerId,
            payer: payer,
            cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
        },
    });
};
exports.createListing = createListing;
const updateListing = (connection, wallet, listingId, marketplaceId, paymentAmount, paymentMint) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.updateListing({
        marketplace: marketplaceId,
        paymentAmount: paymentAmount,
        paymentMint: paymentMint,
    }, {
        accounts: {
            listing: listingId,
            lister: wallet.publicKey,
        },
    });
};
exports.updateListing = updateListing;
const removeListing = async (connection, wallet, listingId, mintId, listerTokenAccountId) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const [tokenManagerId] = await (0, pda_1.findTokenManagerAddress)(mintId);
    const [mintManagerId] = await (0, pda_1.findMintManagerId)(mintId);
    return transferAuthorityProgram.instruction.removeListing({
        accounts: {
            listing: listingId,
            lister: wallet.publicKey,
            mint: mintId,
            mintManager: mintManagerId,
            tokenManager: tokenManagerId,
            listerTokenAccount: listerTokenAccountId,
            cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
};
exports.removeListing = removeListing;
const acceptListing = (connection, wallet, transferAuthorityId, listerPaymentTokenAccountId, listerMintTokenAccountId, lister, buyerPaymentTokenAccountId, buyerMintTokenAccountId, buyer, marketplaceId, mintId, listingId, tokenManagerId, mintMetadataId, transferReceiptId, transferId, paymentManagerId, paymentMintId, feeCollectorTokenAccountId, remainingAccounts, payer = wallet.publicKey) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.acceptListing({
        accounts: {
            transferAuthority: transferAuthorityId,
            transferReceipt: transferReceiptId,
            transfer: transferId,
            listing: listingId,
            listerPaymentTokenAccount: listerPaymentTokenAccountId,
            listerMintTokenAccount: listerMintTokenAccountId,
            lister: lister,
            buyerPaymentTokenAccount: buyerPaymentTokenAccountId,
            buyerMintTokenAccount: buyerMintTokenAccountId,
            buyer: buyer,
            marketplace: marketplaceId,
            tokenManager: tokenManagerId,
            mint: mintId,
            mintMetadataInfo: mintMetadataId,
            paymentManager: paymentManagerId,
            paymentMint: paymentMintId,
            feeCollectorTokenAccount: feeCollectorTokenAccountId,
            payer: payer,
            cardinalPaymentManager: paymentManager_1.PAYMENT_MANAGER_ADDRESS,
            cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
        },
        remainingAccounts: remainingAccounts,
    });
};
exports.acceptListing = acceptListing;
const whitelistMarkeplaces = (connection, wallet, transferAuthorityId, whitelistMarketplaces) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.whitelistMarketplaces({ allowedMarketplaces: whitelistMarketplaces }, {
        accounts: {
            transferAuthority: transferAuthorityId,
            authority: wallet.publicKey,
        },
    });
};
exports.whitelistMarkeplaces = whitelistMarkeplaces;
const initTransfer = (connection, wallet, params) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.initTransfer({ to: params.to }, {
        accounts: {
            transfer: params.transferId,
            tokenManager: params.tokenManagerId,
            holderTokenAccount: params.holderTokenAccountId,
            holder: params.holder,
            payer: params.payer || wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
};
exports.initTransfer = initTransfer;
const cancelTransfer = (connection, wallet, params) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.cancelTransfer({
        accounts: {
            transfer: params.transferId,
            tokenManager: params.tokenManagerId,
            holderTokenAccount: params.holderTokenAccountId,
            holder: params.holder,
        },
    });
};
exports.cancelTransfer = cancelTransfer;
const acceptTransfer = (connection, wallet, params) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.acceptTransfer({
        accounts: {
            transfer: params.transferId,
            transferAuthority: params.transferAuthorityId,
            transferReceipt: params.transferReceiptId,
            listing: params.listingId,
            tokenManager: params.tokenManagerId,
            mint: params.mintId,
            recipientTokenAccount: params.recipientTokenAccountId,
            recipient: params.recipient,
            payer: params.recipient,
            holderTokenAccount: params.holderTokenAccountId,
            holder: params.holder,
            cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
        },
        remainingAccounts: params.remainingAccounts,
    });
};
exports.acceptTransfer = acceptTransfer;
const release = (connection, wallet, params) => {
    const provider = new anchor_1.AnchorProvider(connection, wallet, {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    return transferAuthorityProgram.instruction.release({
        accounts: {
            transferAuthority: params.transferAuthorityId,
            tokenManager: params.tokenManagerId,
            mint: params.mintId,
            tokenManagerTokenAccount: params.tokenManagerTokenAccountId,
            holderTokenAccount: params.holderTokenAccountId,
            holder: params.holder,
            collector: params.holder,
            cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        },
        remainingAccounts: params.remainingAccounts,
    });
};
exports.release = release;
//# sourceMappingURL=instruction.js.map