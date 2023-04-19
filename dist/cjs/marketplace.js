"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRelease = exports.withAcceptTransfer = exports.withCancelTransfer = exports.withInitTransfer = exports.withWhitelistMarektplaces = exports.withAcceptListing = exports.withRemoveListing = exports.withUpdateListing = exports.withCreateListing = exports.withUpdateMarketplace = exports.withInitMarketplace = exports.withUpdateTransferAuthority = exports.withInitTransferAuthority = exports.withWrapToken = void 0;
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const accounts_1 = require("./programs/paymentManager/accounts");
const pda_1 = require("./programs/paymentManager/pda");
const tokenManager_1 = require("./programs/tokenManager");
const accounts_2 = require("./programs/tokenManager/accounts");
const instruction_1 = require("./programs/tokenManager/instruction");
const pda_2 = require("./programs/tokenManager/pda");
const transferAuthority_1 = require("./programs/transferAuthority");
const accounts_3 = require("./programs/transferAuthority/accounts");
const instruction_2 = require("./programs/transferAuthority/instruction");
const pda_3 = require("./programs/transferAuthority/pda");
const transaction_1 = require("./transaction");
const utils_1 = require("./utils");
const wrappedSol_1 = require("./wrappedSol");
const withWrapToken = async (transaction, connection, wallet, mintId, transferAuthorityInfo, payer = wallet.publicKey) => {
    var _a;
    const [tokenManagerId] = await (0, pda_2.findTokenManagerAddress)(mintId);
    const checkTokenManager = await (0, utils_1.tryGetAccount)(() => (0, accounts_2.getTokenManager)(connection, tokenManagerId));
    if (checkTokenManager === null || checkTokenManager === void 0 ? void 0 : checkTokenManager.parsed) {
        throw "Token is already wrapped";
    }
    const issuerTokenAccountId = await (0, utils_1.findAta)(mintId, wallet.publicKey, true);
    let kind = tokenManager_1.TokenManagerKind.Edition;
    const masterEditionId = await mpl_token_metadata_1.MasterEdition.getPDA(mintId);
    const accountInfo = await connection.getAccountInfo(masterEditionId);
    if (!accountInfo)
        kind = tokenManager_1.TokenManagerKind.Permissioned;
    await (0, transaction_1.withIssueToken)(transaction, connection, wallet, {
        mint: mintId,
        invalidationType: tokenManager_1.InvalidationType.Release,
        issuerTokenAccountId: issuerTokenAccountId,
        kind: kind,
        transferAuthorityInfo: transferAuthorityInfo
            ? {
                transferAuthorityName: transferAuthorityInfo.transferAuthorityName,
                setInvalidator: (_a = transferAuthorityInfo.setInvalidator) !== null && _a !== void 0 ? _a : true,
            }
            : undefined,
    }, payer);
    const tokenManagerTokenAccountId = await (0, utils_1.findAta)(mintId, tokenManagerId, true);
    const recipientTokenAccountId = await (0, utils_1.withFindOrInitAssociatedTokenAccount)(transaction, connection, mintId, wallet.publicKey, payer, true);
    transaction.add(await (0, instruction_1.claim)(connection, wallet, tokenManagerId, kind, mintId, tokenManagerTokenAccountId, recipientTokenAccountId, undefined));
    return [transaction, tokenManagerId];
};
exports.withWrapToken = withWrapToken;
const withInitTransferAuthority = async (transaction, connection, wallet, name, authority = wallet.publicKey, payer = wallet.publicKey, allowedMarketplaces) => {
    const [transferAuthority] = await (0, pda_3.findTransferAuthorityAddress)(name);
    transaction.add((0, instruction_2.initTransferAuthority)(connection, wallet, name, transferAuthority, authority, payer, allowedMarketplaces));
    return [transaction, transferAuthority];
};
exports.withInitTransferAuthority = withInitTransferAuthority;
const withUpdateTransferAuthority = async (transaction, connection, wallet, name, authority, allowedMarketplaces) => {
    const [transferAuthorityId] = await (0, pda_3.findTransferAuthorityAddress)(name);
    transaction.add((0, instruction_2.updateTransferAuthority)(connection, wallet, transferAuthorityId, authority, allowedMarketplaces));
    return transaction;
};
exports.withUpdateTransferAuthority = withUpdateTransferAuthority;
const withInitMarketplace = async (transaction, connection, wallet, name, transferAuthorityName, paymentManagerName, paymentMints, payer = wallet.publicKey) => {
    const [transferAuthority] = await (0, pda_3.findTransferAuthorityAddress)(transferAuthorityName);
    const [marketplaceId] = await (0, pda_3.findMarketplaceAddress)(name);
    const [paymentManagerId] = await (0, pda_1.findPaymentManagerAddress)(paymentManagerName);
    transaction.add((0, instruction_2.initMarketplace)(connection, wallet, name, marketplaceId, transferAuthority, paymentManagerId, paymentMints, payer));
    return [transaction, marketplaceId];
};
exports.withInitMarketplace = withInitMarketplace;
const withUpdateMarketplace = async (transaction, connection, wallet, name, transferAuthorityName, paymentManagerName, authority, paymentMints) => {
    const [transferAuthority] = await (0, pda_3.findTransferAuthorityAddress)(transferAuthorityName);
    const [marketplaceId] = await (0, pda_3.findMarketplaceAddress)(name);
    const [paymentManagerId] = await (0, pda_1.findPaymentManagerAddress)(paymentManagerName);
    transaction.add((0, instruction_2.updateMarketplace)(connection, wallet, marketplaceId, transferAuthority, paymentManagerId, authority, paymentMints.length !== 0 ? paymentMints : undefined));
    return transaction;
};
exports.withUpdateMarketplace = withUpdateMarketplace;
const withCreateListing = async (transaction, connection, wallet, mintId, markeptlaceName, paymentAmount, paymentMint = transferAuthority_1.WSOL_MINT, payer = wallet.publicKey) => {
    const [listingId] = await (0, pda_3.findListingAddress)(mintId);
    const [tokenManagerId] = await (0, pda_2.findTokenManagerAddress)(mintId);
    const listerTokenAccountId = await (0, utils_1.findAta)(mintId, wallet.publicKey, true);
    const [marketplaceId] = await (0, pda_3.findMarketplaceAddress)(markeptlaceName);
    const markeptlaceData = await (0, utils_1.tryGetAccount)(() => (0, accounts_3.getMarketplaceByName)(connection, markeptlaceName));
    if (!(markeptlaceData === null || markeptlaceData === void 0 ? void 0 : markeptlaceData.parsed)) {
        throw `No marketplace with name ${markeptlaceName} found`;
    }
    transaction.add(await (0, instruction_2.createListing)(connection, wallet, listingId, mintId, markeptlaceData.parsed.transferAuthority, tokenManagerId, marketplaceId, listerTokenAccountId, paymentAmount, paymentMint, payer));
    return [transaction, marketplaceId];
};
exports.withCreateListing = withCreateListing;
const withUpdateListing = async (transaction, connection, wallet, mintId, paymentAmount, paymentMint) => {
    const listingData = await (0, utils_1.tryGetAccount)(() => (0, accounts_3.getListing)(connection, mintId));
    if (!(listingData === null || listingData === void 0 ? void 0 : listingData.parsed)) {
        throw `No listing found for mint address ${mintId.toString()}`;
    }
    const [listingId] = await (0, pda_3.findListingAddress)(mintId);
    transaction.add((0, instruction_2.updateListing)(connection, wallet, listingId, listingData.parsed.marketplace, paymentAmount, paymentMint));
    return transaction;
};
exports.withUpdateListing = withUpdateListing;
const withRemoveListing = async (transaction, connection, wallet, mintId, listingTokenAccountId) => {
    const [listingId] = await (0, pda_3.findListingAddress)(mintId);
    transaction.add(await (0, instruction_2.removeListing)(connection, wallet, listingId, mintId, listingTokenAccountId));
    return transaction;
};
exports.withRemoveListing = withRemoveListing;
const withAcceptListing = async (transaction, connection, wallet, buyer, mintId) => {
    const listingData = await (0, utils_1.tryGetAccount)(() => (0, accounts_3.getListing)(connection, mintId));
    if (!(listingData === null || listingData === void 0 ? void 0 : listingData.parsed)) {
        throw `No listing found with mint id ${mintId.toString()}`;
    }
    const marketplaceData = await (0, utils_1.tryGetAccount)(() => (0, accounts_3.getMarketplace)(connection, listingData.parsed.marketplace));
    if (!(marketplaceData === null || marketplaceData === void 0 ? void 0 : marketplaceData.parsed)) {
        throw `No marketplace found with id ${mintId.toString()}`;
    }
    const paymentManagerData = await (0, utils_1.tryGetAccount)(() => (0, accounts_1.getPaymentManager)(connection, marketplaceData.parsed.paymentManager));
    if (!(paymentManagerData === null || paymentManagerData === void 0 ? void 0 : paymentManagerData.parsed)) {
        throw `No payment manager found for marketplace with name ${marketplaceData.parsed.name}`;
    }
    const listerPaymentTokenAccountId = await (0, utils_1.withFindOrInitAssociatedTokenAccount)(transaction, connection, listingData.parsed.paymentMint, listingData.parsed.lister, wallet.publicKey);
    const listerMintTokenAccountId = await (0, utils_1.findAta)(mintId, listingData.parsed.lister, true);
    const buyerPaymentTokenAccountId = listingData.parsed.lister.toString() === buyer.toString()
        ? await (0, utils_1.findAta)(listingData.parsed.paymentMint, buyer, true)
        : await (0, utils_1.withFindOrInitAssociatedTokenAccount)(transaction, connection, listingData.parsed.paymentMint, buyer, wallet.publicKey);
    if (listingData.parsed.paymentMint.toString() === transferAuthority_1.WSOL_MINT.toString()) {
        await (0, wrappedSol_1.withWrapSol)(transaction, connection, (0, utils_1.emptyWallet)(buyer), listingData.parsed.paymentAmount.toNumber(), true);
    }
    const buyerMintTokenAccountId = listingData.parsed.lister.toString() === buyer.toString()
        ? await (0, utils_1.findAta)(mintId, buyer, true)
        : await (0, utils_1.withFindOrInitAssociatedTokenAccount)(transaction, connection, mintId, buyer, wallet.publicKey);
    const feeCollectorTokenAccountId = await (0, utils_1.withFindOrInitAssociatedTokenAccount)(transaction, connection, listingData.parsed.paymentMint, paymentManagerData === null || paymentManagerData === void 0 ? void 0 : paymentManagerData.parsed.feeCollector, wallet.publicKey);
    const mintMetadataId = await mpl_token_metadata_1.Metadata.getPDA(mintId);
    const [tokenManagerId] = await (0, pda_2.findTokenManagerAddress)(mintId);
    const [transferReceiptId] = await (0, pda_2.findTransferReceiptId)(tokenManagerId);
    const [transferId] = await (0, pda_3.findTransferAddress)(mintId);
    const remainingAccountsForHandlePaymentWithRoyalties = await (0, tokenManager_1.withRemainingAccountsForHandlePaymentWithRoyalties)(transaction, connection, wallet, mintId, listingData.parsed.paymentMint, [listingData.parsed.lister.toString(), buyer.toString()]);
    const tokenManagerData = await (0, accounts_2.getTokenManager)(connection, tokenManagerId);
    if (!tokenManagerData) {
        throw `No token manager found for ${mintId.toString()}`;
    }
    const remainingAccountsForKind = await (0, tokenManager_1.getRemainingAccountsForKind)(mintId, tokenManagerData.parsed.kind);
    const remainingAccounts = [
        ...remainingAccountsForHandlePaymentWithRoyalties,
        ...remainingAccountsForKind,
    ];
    transaction.add((0, instruction_2.acceptListing)(connection, wallet, marketplaceData.parsed.transferAuthority, listerPaymentTokenAccountId, listerMintTokenAccountId, listingData.parsed.lister, buyerPaymentTokenAccountId, buyerMintTokenAccountId, buyer, marketplaceData.pubkey, mintId, listingData.pubkey, tokenManagerId, mintMetadataId, transferReceiptId, transferId, marketplaceData.parsed.paymentManager, listingData.parsed.paymentMint, feeCollectorTokenAccountId, remainingAccounts));
    return transaction;
};
exports.withAcceptListing = withAcceptListing;
const withWhitelistMarektplaces = async (transaction, connection, wallet, transferAuthorityName, marketplaceNames) => {
    const [transferAuthority] = await (0, pda_3.findTransferAuthorityAddress)(transferAuthorityName);
    const marketplaceIds = (await Promise.all(marketplaceNames.map((name) => (0, pda_3.findMarketplaceAddress)(name)))).map((el) => el[0]);
    transaction.add((0, instruction_2.whitelistMarkeplaces)(connection, wallet, transferAuthority, marketplaceIds));
    return transaction;
};
exports.withWhitelistMarektplaces = withWhitelistMarektplaces;
const withInitTransfer = async (transaction, connection, wallet, to, mintId, holderTokenAccountId, payer = wallet.publicKey) => {
    const [transferId] = await (0, pda_3.findTransferAddress)(mintId);
    const [tokenManagerId] = await (0, pda_2.findTokenManagerAddress)(mintId);
    transaction.add((0, instruction_2.initTransfer)(connection, wallet, {
        to: to,
        transferId: transferId,
        tokenManagerId: tokenManagerId,
        holderTokenAccountId: holderTokenAccountId,
        holder: wallet.publicKey,
        payer: payer,
    }));
    return transaction;
};
exports.withInitTransfer = withInitTransfer;
const withCancelTransfer = async (transaction, connection, wallet, mintId) => {
    const [transferId] = await (0, pda_3.findTransferAddress)(mintId);
    const [tokenManagerId] = await (0, pda_2.findTokenManagerAddress)(mintId);
    const checkTokenManager = await (0, utils_1.tryGetAccount)(() => (0, accounts_2.getTokenManager)(connection, tokenManagerId));
    if (!checkTokenManager) {
        throw `No token manager found for mint id ${mintId.toString()}`;
    }
    transaction.add((0, instruction_2.cancelTransfer)(connection, wallet, {
        transferId: transferId,
        tokenManagerId: tokenManagerId,
        holderTokenAccountId: checkTokenManager.parsed.recipientTokenAccount,
        holder: wallet.publicKey,
    }));
    return transaction;
};
exports.withCancelTransfer = withCancelTransfer;
const withAcceptTransfer = async (transaction, connection, wallet, mintId, recipient, holder) => {
    const [transferId] = await (0, pda_3.findTransferAddress)(mintId);
    const [tokenManagerId] = await (0, pda_2.findTokenManagerAddress)(mintId);
    const [transferReceiptId] = await (0, pda_2.findTransferReceiptId)(tokenManagerId);
    const [listingId] = await (0, pda_3.findListingAddress)(mintId);
    const tokenManagerData = await (0, utils_1.tryGetAccount)(() => (0, accounts_2.getTokenManager)(connection, tokenManagerId));
    if (!tokenManagerData) {
        throw `No token manager found for mint ${mintId.toString()}`;
    }
    if (!tokenManagerData.parsed.transferAuthority) {
        throw `No transfer autority found for mint id ${mintId.toString()}`;
    }
    const recipientTokenAccountId = await (0, utils_1.findAta)(mintId, recipient, true);
    const remainingAccountsForTransfer = [
        ...(await (0, tokenManager_1.getRemainingAccountsForKind)(mintId, tokenManagerData.parsed.kind)),
        {
            pubkey: transferReceiptId,
            isSigner: false,
            isWritable: true,
        },
    ];
    transaction.add((0, instruction_2.acceptTransfer)(connection, wallet, {
        transferId: transferId,
        tokenManagerId: tokenManagerId,
        holderTokenAccountId: tokenManagerData.parsed.recipientTokenAccount,
        holder: holder,
        recipient: recipient,
        recipientTokenAccountId: recipientTokenAccountId,
        mintId: mintId,
        transferReceiptId: transferReceiptId,
        listingId: listingId,
        transferAuthorityId: tokenManagerData.parsed.transferAuthority,
        remainingAccounts: remainingAccountsForTransfer,
    }));
    return transaction;
};
exports.withAcceptTransfer = withAcceptTransfer;
const withRelease = async (transaction, connection, wallet, mintId, transferAuthorityId, holderTokenAccountId, payer = wallet.publicKey) => {
    const [tokenManagerId] = await (0, pda_2.findTokenManagerAddress)(mintId);
    const checkTokenManager = await (0, utils_1.tryGetAccount)(() => (0, accounts_2.getTokenManager)(connection, tokenManagerId));
    if (!checkTokenManager) {
        throw `No token manager found for mint id ${mintId.toString()}`;
    }
    const tokenManagerTokenAccount = await (0, utils_1.withFindOrInitAssociatedTokenAccount)(transaction, connection, mintId, tokenManagerId, payer, true);
    const tokenManagerData = await (0, accounts_2.getTokenManager)(connection, tokenManagerId);
    const remainingAccountsForKind = await (0, tokenManager_1.getRemainingAccountsForKind)(mintId, tokenManagerData.parsed.kind);
    const remainingAccountsForReturn = await (0, tokenManager_1.withRemainingAccountsForReturn)(transaction, connection, wallet, tokenManagerData);
    transaction.add((0, instruction_2.release)(connection, wallet, {
        transferAuthorityId: transferAuthorityId,
        tokenManagerId: tokenManagerId,
        mintId: mintId,
        tokenManagerTokenAccountId: tokenManagerTokenAccount,
        holderTokenAccountId: holderTokenAccountId,
        holder: wallet.publicKey,
        remainingAccounts: [
            ...remainingAccountsForKind,
            ...remainingAccountsForReturn,
        ],
    }));
    return transaction;
};
exports.withRelease = withRelease;
//# sourceMappingURL=marketplace.js.map