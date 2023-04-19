"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSend = exports.withUndelegate = exports.withDelegate = exports.withTransfer = exports.withUpdateMaxExpiration = exports.withResetExpiration = exports.withExtendUsages = exports.withExtendExpiration = exports.withUse = exports.withReturn = exports.withInvalidate = exports.withUnissueToken = exports.withClaimToken = exports.withIssueToken = void 0;
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const _1 = require(".");
const programs_1 = require("./programs");
const utils_1 = require("./programs/timeInvalidator/utils");
const tokenManager_1 = require("./programs/tokenManager");
const accounts_1 = require("./programs/tokenManager/accounts");
const instruction_1 = require("./programs/tokenManager/instruction");
const pda_1 = require("./programs/tokenManager/pda");
const utils_2 = require("./programs/tokenManager/utils");
const accounts_2 = require("./programs/transferAuthority/accounts");
const utils_3 = require("./utils");
/**
 * Main method for issuing any managed token
 * Allows for optional payment, optional usages or expiration and includes a otp for private links
 * @param connection
 * @param wallet
 * @param parameters
 * @returns Transaction, public key for the created token manager and a otp if necessary for private links
 */
const withIssueToken = async (transaction, connection, wallet, { claimPayment, timeInvalidation, useInvalidation, mint, issuerTokenAccountId, amount = new anchor_1.BN(1), transferAuthorityInfo, kind = tokenManager_1.TokenManagerKind.Managed, invalidationType = tokenManager_1.InvalidationType.Return, visibility = "public", permissionedClaimApprover, receiptOptions = undefined, customInvalidators = undefined, }, payer = wallet.publicKey) => {
    // create mint manager
    if (kind === tokenManager_1.TokenManagerKind.Managed ||
        kind === tokenManager_1.TokenManagerKind.Permissioned) {
        const [mintManagerIx, mintManagerId] = await programs_1.tokenManager.instruction.creatMintManager(connection, wallet, mint, payer);
        const mintManagerData = await (0, utils_3.tryGetAccount)(() => programs_1.tokenManager.accounts.getMintManager(connection, mintManagerId));
        if (!mintManagerData) {
            transaction.add(mintManagerIx);
        }
    }
    // init token manager
    const numInvalidator = (customInvalidators ? customInvalidators.length : 0) +
        (useInvalidation && timeInvalidation
            ? 2
            : useInvalidation || timeInvalidation
                ? 1
                : 0) +
        ((transferAuthorityInfo === null || transferAuthorityInfo === void 0 ? void 0 : transferAuthorityInfo.setInvalidator) ? 1 : 0);
    const [tokenManagerIx, tokenManagerId] = await programs_1.tokenManager.instruction.init(connection, wallet, mint, issuerTokenAccountId, amount, kind, invalidationType, numInvalidator, payer);
    transaction.add(tokenManagerIx);
    if (transferAuthorityInfo) {
        const checkTransferAuthority = await (0, utils_3.tryGetAccount)(() => (0, accounts_2.getTransferAuthorityByName)(connection, transferAuthorityInfo.transferAuthorityName));
        if (!(checkTransferAuthority === null || checkTransferAuthority === void 0 ? void 0 : checkTransferAuthority.parsed)) {
            throw `No transfer authority with name ${transferAuthorityInfo.transferAuthorityName} found`;
        }
        transaction.add((0, instruction_1.setTransferAuthority)(connection, wallet, tokenManagerId, checkTransferAuthority.pubkey));
        if (transferAuthorityInfo.setInvalidator) {
            transaction.add(programs_1.tokenManager.instruction.addInvalidator(connection, wallet, tokenManagerId, checkTransferAuthority.pubkey));
        }
    }
    //////////////////////////////
    /////// claim approver ///////
    //////////////////////////////
    let otp;
    if (claimPayment) {
        if (visibility !== "public") {
            throw "Paid rentals currently must be public";
        }
        const [paidClaimApproverIx, paidClaimApproverId] = await programs_1.claimApprover.instruction.init(connection, wallet, tokenManagerId, claimPayment, payer);
        transaction.add(paidClaimApproverIx);
        transaction.add(programs_1.tokenManager.instruction.setClaimApprover(connection, wallet, tokenManagerId, paidClaimApproverId));
    }
    else if (visibility === "private") {
        otp = web3_js_1.Keypair.generate();
        transaction.add(programs_1.tokenManager.instruction.setClaimApprover(connection, wallet, tokenManagerId, otp.publicKey));
    }
    else if (visibility === "permissioned") {
        if (!permissionedClaimApprover) {
            throw "Claim approver is not specified for permissioned link";
        }
        transaction.add(programs_1.tokenManager.instruction.setClaimApprover(connection, wallet, tokenManagerId, permissionedClaimApprover));
    }
    //////////////////////////////
    /////// time invalidator /////
    //////////////////////////////
    if (timeInvalidation) {
        const [timeInvalidatorIx, timeInvalidatorId] = await programs_1.timeInvalidator.instruction.init(connection, wallet, tokenManagerId, timeInvalidation, payer);
        transaction.add(timeInvalidatorIx);
        transaction.add(programs_1.tokenManager.instruction.addInvalidator(connection, wallet, tokenManagerId, timeInvalidatorId));
    }
    else {
        const [timeInvalidatorId] = await programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
        const timeInvalidatorData = await (0, utils_3.tryGetAccount)(() => programs_1.timeInvalidator.accounts.getTimeInvalidator(connection, timeInvalidatorId));
        if (timeInvalidatorData) {
            transaction.add(programs_1.timeInvalidator.instruction.close(connection, wallet, timeInvalidatorId, tokenManagerId, timeInvalidatorData.parsed.collector));
        }
    }
    //////////////////////////////
    /////////// usages ///////////
    //////////////////////////////
    if (useInvalidation) {
        const [useInvalidatorIx, useInvalidatorId] = await programs_1.useInvalidator.instruction.init(connection, wallet, tokenManagerId, useInvalidation, payer);
        transaction.add(useInvalidatorIx);
        transaction.add(programs_1.tokenManager.instruction.addInvalidator(connection, wallet, tokenManagerId, useInvalidatorId));
    }
    else {
        const [useInvalidatorId] = await programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId);
        const useInvalidatorData = await (0, utils_3.tryGetAccount)(() => programs_1.useInvalidator.accounts.getUseInvalidator(connection, useInvalidatorId));
        if (useInvalidatorData) {
            transaction.add(programs_1.useInvalidator.instruction.close(connection, wallet, useInvalidatorId, tokenManagerId, useInvalidatorData.parsed.collector));
        }
    }
    /////////////////////////////////////////
    //////////// custom invalidators ////////
    /////////////////////////////////////////
    if (customInvalidators) {
        for (const invalidator of customInvalidators) {
            transaction.add(programs_1.tokenManager.instruction.addInvalidator(connection, wallet, tokenManagerId, invalidator));
        }
    }
    // issuer
    const tokenManagerTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, mint, tokenManagerId, payer, true);
    transaction.add(programs_1.tokenManager.instruction.issue(connection, wallet, tokenManagerId, tokenManagerTokenAccountId, issuerTokenAccountId, payer, kind === tokenManager_1.TokenManagerKind.Permissioned
        ? [
            {
                pubkey: tokenManager_1.CRANK_KEY,
                isSigner: false,
                isWritable: true,
            },
        ]
        : []));
    //////////////////////////////
    //////////// index ///////////
    //////////////////////////////
    if (receiptOptions) {
        const { receiptMintKeypair } = receiptOptions;
        transaction.add(await programs_1.tokenManager.instruction.claimReceiptMint(connection, wallet, "receipt", tokenManagerId, receiptMintKeypair.publicKey, payer));
    }
    return [transaction, tokenManagerId, otp];
};
exports.withIssueToken = withIssueToken;
/**
 * Add claim instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param tokenManagerId
 * @param otpKeypair
 * @returns Transaction with relevent claim instructions added
 */
const withClaimToken = async (transaction, connection, wallet, tokenManagerId, additionalOptions) => {
    var _a;
    const [tokenManagerData, claimApproverData] = await Promise.all([
        programs_1.tokenManager.accounts.getTokenManager(connection, tokenManagerId),
        (0, utils_3.tryGetAccount)(() => programs_1.claimApprover.accounts.getClaimApprover(connection, tokenManagerId)),
    ]);
    let claimReceiptId;
    // pay claim approver
    if (claimApproverData &&
        tokenManagerData.parsed.claimApprover &&
        tokenManagerData.parsed.claimApprover.toString() ===
            claimApproverData.pubkey.toString()) {
        const payerTokenAccountId = await (0, _1.findAta)(claimApproverData.parsed.paymentMint, wallet.publicKey);
        [claimReceiptId] = await programs_1.tokenManager.pda.findClaimReceiptId(tokenManagerId, wallet.publicKey);
        const paymentAccounts = await (0, utils_2.withRemainingAccountsForPayment)(transaction, connection, wallet, tokenManagerData.parsed.mint, claimApproverData.parsed.paymentMint, tokenManagerData.parsed.issuer, claimApproverData.parsed.paymentManager, {
            receiptMint: tokenManagerData.parsed.receiptMint,
            payer: additionalOptions === null || additionalOptions === void 0 ? void 0 : additionalOptions.payer,
        });
        transaction.add(await programs_1.claimApprover.instruction.pay(connection, wallet, tokenManagerId, payerTokenAccountId, claimApproverData.parsed.paymentManager, paymentAccounts));
    }
    else if (tokenManagerData.parsed.claimApprover) {
        // approve claim request
        const [createClaimReceiptIx, claimReceipt] = await programs_1.tokenManager.instruction.createClaimReceipt(connection, wallet, tokenManagerId, tokenManagerData.parsed.claimApprover, additionalOptions === null || additionalOptions === void 0 ? void 0 : additionalOptions.payer);
        transaction.add(createClaimReceiptIx);
        claimReceiptId = claimReceipt;
    }
    const tokenManagerTokenAccountId = await spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, tokenManagerData.parsed.mint, tokenManagerId, true);
    const recipientTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, tokenManagerData.parsed.mint, wallet.publicKey, (_a = additionalOptions === null || additionalOptions === void 0 ? void 0 : additionalOptions.payer) !== null && _a !== void 0 ? _a : wallet.publicKey);
    // claim
    transaction.add(await programs_1.tokenManager.instruction.claim(connection, wallet, tokenManagerId, tokenManagerData.parsed.kind, tokenManagerData.parsed.mint, tokenManagerTokenAccountId, recipientTokenAccountId, claimReceiptId));
    return transaction;
};
exports.withClaimToken = withClaimToken;
const withUnissueToken = async (transaction, connection, wallet, mintId) => {
    const tokenManagerId = await (0, pda_1.tokenManagerAddressFromMint)(connection, mintId);
    const tokenManagerTokenAccountId = await (0, _1.findAta)(mintId, tokenManagerId, true);
    const issuerTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, mintId, wallet.publicKey, wallet.publicKey);
    return transaction.add(programs_1.tokenManager.instruction.unissue(connection, wallet, tokenManagerId, tokenManagerTokenAccountId, issuerTokenAccountId));
};
exports.withUnissueToken = withUnissueToken;
const withInvalidate = async (transaction, connection, wallet, mintId, UTCNow = Date.now() / 1000) => {
    const tokenManagerId = await (0, pda_1.tokenManagerAddressFromMint)(connection, mintId);
    const [[useInvalidatorId], [timeInvalidatorId]] = await Promise.all([
        programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId),
        programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
    ]);
    const [useInvalidatorData, timeInvalidatorData, tokenManagerData] = await Promise.all([
        (0, utils_3.tryGetAccount)(() => programs_1.useInvalidator.accounts.getUseInvalidator(connection, useInvalidatorId)),
        (0, utils_3.tryGetAccount)(() => programs_1.timeInvalidator.accounts.getTimeInvalidator(connection, timeInvalidatorId)),
        (0, utils_3.tryGetAccount)(() => programs_1.tokenManager.accounts.getTokenManager(connection, tokenManagerId)),
    ]);
    if (!tokenManagerData)
        return transaction;
    const tokenManagerTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, mintId, tokenManagerId, wallet.publicKey, true);
    const remainingAccountsForReturn = await (0, utils_2.withRemainingAccountsForReturn)(transaction, connection, wallet, tokenManagerData);
    if (useInvalidatorData &&
        useInvalidatorData.parsed.totalUsages &&
        useInvalidatorData.parsed.usages.gte(useInvalidatorData.parsed.totalUsages)) {
        transaction.add(await programs_1.useInvalidator.instruction.invalidate(connection, wallet, mintId, tokenManagerId, tokenManagerData.parsed.kind, tokenManagerData.parsed.state, tokenManagerTokenAccountId, tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed.recipientTokenAccount, remainingAccountsForReturn));
        transaction.add(programs_1.useInvalidator.instruction.close(connection, wallet, useInvalidatorId, tokenManagerId, useInvalidatorData.parsed.collector));
    }
    else if (timeInvalidatorData &&
        (0, utils_1.shouldTimeInvalidate)(tokenManagerData, timeInvalidatorData, UTCNow)) {
        transaction.add(await programs_1.timeInvalidator.instruction.invalidate(connection, wallet, mintId, tokenManagerId, tokenManagerData.parsed.kind, tokenManagerData.parsed.state, tokenManagerTokenAccountId, tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed.recipientTokenAccount, remainingAccountsForReturn));
        transaction.add(programs_1.timeInvalidator.instruction.close(connection, wallet, timeInvalidatorData.pubkey, timeInvalidatorData.parsed.tokenManager, timeInvalidatorData.parsed.collector));
    }
    else if (tokenManagerData.parsed.invalidators.some((inv) => inv.equals(wallet.publicKey)) ||
        tokenManagerData.parsed.invalidationType === tokenManager_1.InvalidationType.Return ||
        tokenManagerData.parsed.invalidationType === tokenManager_1.InvalidationType.Reissue) {
        transaction.add(await programs_1.tokenManager.instruction.invalidate(connection, wallet, mintId, tokenManagerId, tokenManagerData.parsed.kind, tokenManagerData.parsed.state, tokenManagerTokenAccountId, tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed.recipientTokenAccount, remainingAccountsForReturn));
    }
    return transaction;
};
exports.withInvalidate = withInvalidate;
const withReturn = async (transaction, connection, wallet, tokenManagerData) => {
    const tokenManagerTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, tokenManagerData.parsed.mint, tokenManagerData.pubkey, wallet.publicKey, true);
    const remainingAccountsForReturn = await (0, utils_2.withRemainingAccountsForReturn)(transaction, connection, wallet, tokenManagerData);
    transaction.add(await programs_1.tokenManager.instruction.invalidate(connection, wallet, tokenManagerData.parsed.mint, tokenManagerData.pubkey, tokenManagerData.parsed.kind, tokenManagerData.parsed.state, tokenManagerTokenAccountId, tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed.recipientTokenAccount, remainingAccountsForReturn));
    return transaction;
};
exports.withReturn = withReturn;
const withUse = async (transaction, connection, wallet, mintId, usages, collector) => {
    const tokenManagerId = await (0, pda_1.tokenManagerAddressFromMint)(connection, mintId);
    const [useInvalidatorId] = await programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId);
    const [useInvalidatorData, tokenManagerData] = await Promise.all([
        (0, utils_3.tryGetAccount)(() => programs_1.useInvalidator.accounts.getUseInvalidator(connection, useInvalidatorId)),
        (0, utils_3.tryGetAccount)(() => programs_1.tokenManager.accounts.getTokenManager(connection, tokenManagerId)),
    ]);
    if (!useInvalidatorData) {
        // init
        const [InitTx] = await programs_1.useInvalidator.instruction.init(connection, wallet, tokenManagerId, { collector: collector });
        transaction.add(InitTx);
    }
    if (!(tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed.recipientTokenAccount))
        throw new Error("Token manager has not been claimed");
    // use
    transaction.add(await programs_1.useInvalidator.instruction.incrementUsages(connection, wallet, tokenManagerId, tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed.recipientTokenAccount, usages));
    if ((useInvalidatorData === null || useInvalidatorData === void 0 ? void 0 : useInvalidatorData.parsed.totalUsages) &&
        (useInvalidatorData === null || useInvalidatorData === void 0 ? void 0 : useInvalidatorData.parsed.usages.add(new anchor_1.BN(usages)).gte(useInvalidatorData === null || useInvalidatorData === void 0 ? void 0 : useInvalidatorData.parsed.totalUsages))) {
        const tokenManagerTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, mintId, tokenManagerId, wallet.publicKey, true);
        const remainingAccountsForReturn = await (0, utils_2.withRemainingAccountsForReturn)(transaction, connection, wallet, tokenManagerData);
        transaction.add(await programs_1.useInvalidator.instruction.invalidate(connection, wallet, mintId, tokenManagerId, tokenManagerData.parsed.kind, tokenManagerData.parsed.state, tokenManagerTokenAccountId, tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed.recipientTokenAccount, remainingAccountsForReturn));
        transaction.add(programs_1.useInvalidator.instruction.close(connection, wallet, useInvalidatorId, tokenManagerId, useInvalidatorData.parsed.collector));
    }
    return transaction;
};
exports.withUse = withUse;
const withExtendExpiration = async (transaction, connection, wallet, tokenManagerId, secondsToAdd, options) => {
    const [timeInvalidatorId] = await programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
    const [timeInvalidatorData, tokenManagerData] = await Promise.all([
        programs_1.timeInvalidator.accounts.getTimeInvalidator(connection, timeInvalidatorId),
        programs_1.tokenManager.accounts.getTokenManager(connection, tokenManagerId),
    ]);
    if (timeInvalidatorData && timeInvalidatorData.parsed.extensionPaymentMint) {
        const payerTokenAccountId = await (0, _1.findAta)(timeInvalidatorData.parsed.extensionPaymentMint, wallet.publicKey);
        const paymentAccounts = await (0, utils_2.withRemainingAccountsForPayment)(transaction, connection, wallet, tokenManagerData.parsed.mint, timeInvalidatorData.parsed.extensionPaymentMint, tokenManagerData.parsed.issuer, timeInvalidatorData.parsed.paymentManager, {
            receiptMint: tokenManagerData.parsed.receiptMint,
            payer: options === null || options === void 0 ? void 0 : options.payer,
        });
        transaction.add(programs_1.timeInvalidator.instruction.extendExpiration(connection, wallet, tokenManagerId, timeInvalidatorData.parsed.paymentManager, payerTokenAccountId, timeInvalidatorId, secondsToAdd, paymentAccounts));
    }
    else {
        console.log("No payment mint");
    }
    return transaction;
};
exports.withExtendExpiration = withExtendExpiration;
const withExtendUsages = async (transaction, connection, wallet, tokenManagerId, usagesToAdd, options) => {
    const [useInvalidatorId] = await programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId);
    const [useInvalidatorData, tokenManagerData] = await Promise.all([
        programs_1.useInvalidator.accounts.getUseInvalidator(connection, useInvalidatorId),
        programs_1.tokenManager.accounts.getTokenManager(connection, tokenManagerId),
    ]);
    if (useInvalidatorData && useInvalidatorData.parsed.extensionPaymentMint) {
        const payerTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, useInvalidatorData.parsed.extensionPaymentMint, wallet.publicKey, wallet.publicKey);
        const paymentAccounts = await (0, utils_2.withRemainingAccountsForPayment)(transaction, connection, wallet, tokenManagerData.parsed.mint, useInvalidatorData.parsed.extensionPaymentMint, tokenManagerData.parsed.issuer, useInvalidatorData.parsed.paymentManager, {
            receiptMint: tokenManagerData.parsed.receiptMint,
            payer: options === null || options === void 0 ? void 0 : options.payer,
        });
        transaction.add(programs_1.useInvalidator.instruction.extendUsages(connection, wallet, tokenManagerId, useInvalidatorData.parsed.paymentManager, payerTokenAccountId, useInvalidatorId, usagesToAdd, paymentAccounts));
    }
    return transaction;
};
exports.withExtendUsages = withExtendUsages;
const withResetExpiration = async (transaction, connection, wallet, tokenManagerId) => {
    const [timeInvalidatorId] = await programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
    const [tokenManagerData] = await Promise.all([
        programs_1.tokenManager.accounts.getTokenManager(connection, tokenManagerId),
    ]);
    if (tokenManagerData.parsed.state === tokenManager_1.TokenManagerState.Issued) {
        transaction.add(programs_1.timeInvalidator.instruction.resetExpiration(connection, wallet, tokenManagerId, timeInvalidatorId));
    }
    else {
        console.log("Token Manager not in state issued to reset expiration");
    }
    return transaction;
};
exports.withResetExpiration = withResetExpiration;
const withUpdateMaxExpiration = async (transaction, connection, wallet, tokenManagerId, newMaxExpiration) => {
    const [timeInvalidatorId] = await programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
    const [tokenManagerData] = await Promise.all([
        programs_1.tokenManager.accounts.getTokenManager(connection, tokenManagerId),
    ]);
    if (tokenManagerData.parsed.state !== tokenManager_1.TokenManagerState.Invalidated) {
        transaction.add(programs_1.timeInvalidator.instruction.updateMaxExpiration(connection, wallet, timeInvalidatorId, tokenManagerId, newMaxExpiration));
    }
    else {
        console.log("Token Manager not in state issued to update max expiration");
    }
    return transaction;
};
exports.withUpdateMaxExpiration = withUpdateMaxExpiration;
const withTransfer = async (transaction, connection, wallet, mintId, recipient = wallet.publicKey) => {
    const [tokenManagerId] = await (0, pda_1.findTokenManagerAddress)(mintId);
    const tokenManagerData = await (0, utils_3.tryGetAccount)(() => (0, accounts_1.getTokenManager)(connection, tokenManagerId));
    if (!(tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed)) {
        throw "No token manager found";
    }
    const recipientTokenAccountId = await (0, utils_3.withFindOrInitAssociatedTokenAccount)(transaction, connection, mintId, recipient, wallet.publicKey, true);
    const remainingAccountsForKind = await (0, utils_2.getRemainingAccountsForKind)(mintId, tokenManagerData.parsed.kind);
    const remainingAccountsForTransfer = await (0, utils_2.getRemainingAccountsForTransfer)(tokenManagerData.parsed.transferAuthority, tokenManagerId);
    transaction.add(programs_1.tokenManager.instruction.transfer(connection, wallet, tokenManagerId, mintId, tokenManagerData.parsed.recipientTokenAccount, recipient, recipientTokenAccountId, [...remainingAccountsForKind, ...remainingAccountsForTransfer]));
    return transaction;
};
exports.withTransfer = withTransfer;
const withDelegate = async (transaction, connection, wallet, mintId, recipient = wallet.publicKey) => {
    const [tokenManagerId] = await (0, pda_1.findTokenManagerAddress)(mintId);
    const tokenManagerData = await (0, utils_3.tryGetAccount)(() => (0, accounts_1.getTokenManager)(connection, tokenManagerId));
    if (!(tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed)) {
        throw "No token manager found";
    }
    const [mintManagerId] = await (0, pda_1.findMintManagerId)(mintId);
    transaction.add(programs_1.tokenManager.instruction.delegate(connection, wallet, mintId, tokenManagerId, mintManagerId, recipient, tokenManagerData.parsed.recipientTokenAccount));
    return transaction;
};
exports.withDelegate = withDelegate;
const withUndelegate = async (transaction, connection, wallet, mintId, recipient) => {
    const [tokenManagerId] = await (0, pda_1.findTokenManagerAddress)(mintId);
    const tokenManagerData = await (0, utils_3.tryGetAccount)(() => (0, accounts_1.getTokenManager)(connection, tokenManagerId));
    if (!(tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed)) {
        throw "No token manager found";
    }
    const [mintManagerId] = await (0, pda_1.findMintManagerId)(mintId);
    const recipientTokenAccountId = await (0, _1.findAta)(mintId, recipient !== null && recipient !== void 0 ? recipient : wallet.publicKey, true);
    transaction.add(programs_1.tokenManager.instruction.undelegate(connection, wallet, mintId, tokenManagerId, mintManagerId, recipient !== null && recipient !== void 0 ? recipient : wallet.publicKey, recipientTokenAccountId));
    return transaction;
};
exports.withUndelegate = withUndelegate;
const withSend = async (transaction, connection, wallet, mintId, senderTokenAccountId, target) => {
    const [tokenManagerId] = await (0, pda_1.findTokenManagerAddress)(mintId);
    const tokenManagerData = await (0, utils_3.tryGetAccount)(() => (0, accounts_1.getTokenManager)(connection, tokenManagerId));
    if (!(tokenManagerData === null || tokenManagerData === void 0 ? void 0 : tokenManagerData.parsed)) {
        throw "No token manager found";
    }
    const [mintManagerId] = await (0, pda_1.findMintManagerId)(mintId);
    const targetTokenAccountId = await (0, _1.findAta)(mintId, target, true);
    transaction.add(programs_1.tokenManager.instruction.send(connection, wallet, mintId, tokenManagerId, mintManagerId, wallet.publicKey, senderTokenAccountId, target, targetTokenAccountId));
    return transaction;
};
exports.withSend = withSend;
//# sourceMappingURL=transaction.js.map