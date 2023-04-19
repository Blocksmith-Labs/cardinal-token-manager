import { MasterEdition, Metadata, } from "@metaplex-foundation/mpl-token-metadata";
import { getPaymentManager } from "./programs/paymentManager/accounts";
import { findPaymentManagerAddress } from "./programs/paymentManager/pda";
import { getRemainingAccountsForKind, InvalidationType, TokenManagerKind, withRemainingAccountsForHandlePaymentWithRoyalties, withRemainingAccountsForReturn, } from "./programs/tokenManager";
import { getTokenManager } from "./programs/tokenManager/accounts";
import { claim } from "./programs/tokenManager/instruction";
import { findTokenManagerAddress, findTransferReceiptId, } from "./programs/tokenManager/pda";
import { WSOL_MINT } from "./programs/transferAuthority";
import { getListing, getMarketplace, getMarketplaceByName, } from "./programs/transferAuthority/accounts";
import { acceptListing, acceptTransfer, cancelTransfer, createListing, initMarketplace, initTransfer, initTransferAuthority, release, removeListing, updateListing, updateMarketplace, updateTransferAuthority, whitelistMarkeplaces, } from "./programs/transferAuthority/instruction";
import { findListingAddress, findMarketplaceAddress, findTransferAddress, findTransferAuthorityAddress, } from "./programs/transferAuthority/pda";
import { withIssueToken } from "./transaction";
import { emptyWallet, findAta, tryGetAccount, withFindOrInitAssociatedTokenAccount, } from "./utils";
import { withWrapSol } from "./wrappedSol";
export const withWrapToken = async (transaction, connection, wallet, mintId, transferAuthorityInfo, payer = wallet.publicKey) => {
    var _a;
    const [tokenManagerId] = await findTokenManagerAddress(mintId);
    const checkTokenManager = await tryGetAccount(() => getTokenManager(connection, tokenManagerId));
    if (checkTokenManager === null || checkTokenManager === void 0 ? void 0 : checkTokenManager.parsed) {
        throw "Token is already wrapped";
    }
    const issuerTokenAccountId = await findAta(mintId, wallet.publicKey, true);
    let kind = TokenManagerKind.Edition;
    const masterEditionId = await MasterEdition.getPDA(mintId);
    const accountInfo = await connection.getAccountInfo(masterEditionId);
    if (!accountInfo)
        kind = TokenManagerKind.Permissioned;
    await withIssueToken(transaction, connection, wallet, {
        mint: mintId,
        invalidationType: InvalidationType.Release,
        issuerTokenAccountId: issuerTokenAccountId,
        kind: kind,
        transferAuthorityInfo: transferAuthorityInfo
            ? {
                transferAuthorityName: transferAuthorityInfo.transferAuthorityName,
                setInvalidator: (_a = transferAuthorityInfo.setInvalidator) !== null && _a !== void 0 ? _a : true,
            }
            : undefined,
    }, payer);
    const tokenManagerTokenAccountId = await findAta(mintId, tokenManagerId, true);
    const recipientTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, mintId, wallet.publicKey, payer, true);
    transaction.add(await claim(connection, wallet, tokenManagerId, kind, mintId, tokenManagerTokenAccountId, recipientTokenAccountId, undefined));
    return [transaction, tokenManagerId];
};
export const withInitTransferAuthority = async (transaction, connection, wallet, name, authority = wallet.publicKey, payer = wallet.publicKey, allowedMarketplaces) => {
    const [transferAuthority] = await findTransferAuthorityAddress(name);
    transaction.add(initTransferAuthority(connection, wallet, name, transferAuthority, authority, payer, allowedMarketplaces));
    return [transaction, transferAuthority];
};
export const withUpdateTransferAuthority = async (transaction, connection, wallet, name, authority, allowedMarketplaces) => {
    const [transferAuthorityId] = await findTransferAuthorityAddress(name);
    transaction.add(updateTransferAuthority(connection, wallet, transferAuthorityId, authority, allowedMarketplaces));
    return transaction;
};
export const withInitMarketplace = async (transaction, connection, wallet, name, transferAuthorityName, paymentManagerName, paymentMints, payer = wallet.publicKey) => {
    const [transferAuthority] = await findTransferAuthorityAddress(transferAuthorityName);
    const [marketplaceId] = await findMarketplaceAddress(name);
    const [paymentManagerId] = await findPaymentManagerAddress(paymentManagerName);
    transaction.add(initMarketplace(connection, wallet, name, marketplaceId, transferAuthority, paymentManagerId, paymentMints, payer));
    return [transaction, marketplaceId];
};
export const withUpdateMarketplace = async (transaction, connection, wallet, name, transferAuthorityName, paymentManagerName, authority, paymentMints) => {
    const [transferAuthority] = await findTransferAuthorityAddress(transferAuthorityName);
    const [marketplaceId] = await findMarketplaceAddress(name);
    const [paymentManagerId] = await findPaymentManagerAddress(paymentManagerName);
    transaction.add(updateMarketplace(connection, wallet, marketplaceId, transferAuthority, paymentManagerId, authority, paymentMints.length !== 0 ? paymentMints : undefined));
    return transaction;
};
export const withCreateListing = async (transaction, connection, wallet, mintId, markeptlaceName, paymentAmount, paymentMint = WSOL_MINT, payer = wallet.publicKey) => {
    const [listingId] = await findListingAddress(mintId);
    const [tokenManagerId] = await findTokenManagerAddress(mintId);
    const listerTokenAccountId = await findAta(mintId, wallet.publicKey, true);
    const [marketplaceId] = await findMarketplaceAddress(markeptlaceName);
    const markeptlaceData = await tryGetAccount(() => getMarketplaceByName(connection, markeptlaceName));
    if (!(markeptlaceData === null || markeptlaceData === void 0 ? void 0 : markeptlaceData.parsed)) {
        throw `No marketplace with name ${markeptlaceName} found`;
    }
    transaction.add(await createListing(connection, wallet, listingId, mintId, markeptlaceData.parsed.transferAuthority, tokenManagerId, marketplaceId, listerTokenAccountId, paymentAmount, paymentMint, payer));
    return [transaction, marketplaceId];
};
export const withUpdateListing = async (transaction, connection, wallet, mintId, paymentAmount, paymentMint) => {
    const listingData = await tryGetAccount(() => getListing(connection, mintId));
    if (!(listingData === null || listingData === void 0 ? void 0 : listingData.parsed)) {
        throw `No listing found for mint address ${mintId.toString()}`;
    }
    const [listingId] = await findListingAddress(mintId);
    transaction.add(updateListing(connection, wallet, listingId, listingData.parsed.marketplace, paymentAmount, paymentMint));
    return transaction;
};
export const withRemoveListing = async (transaction, connection, wallet, mintId, listingTokenAccountId) => {
    const [listingId] = await findListingAddress(mintId);
    transaction.add(await removeListing(connection, wallet, listingId, mintId, listingTokenAccountId));
    return transaction;
};
export const withAcceptListing = async (transaction, connection, wallet, buyer, mintId) => {
    const listingData = await tryGetAccount(() => getListing(connection, mintId));
    if (!(listingData === null || listingData === void 0 ? void 0 : listingData.parsed)) {
        throw `No listing found with mint id ${mintId.toString()}`;
    }
    const marketplaceData = await tryGetAccount(() => getMarketplace(connection, listingData.parsed.marketplace));
    if (!(marketplaceData === null || marketplaceData === void 0 ? void 0 : marketplaceData.parsed)) {
        throw `No marketplace found with id ${mintId.toString()}`;
    }
    const paymentManagerData = await tryGetAccount(() => getPaymentManager(connection, marketplaceData.parsed.paymentManager));
    if (!(paymentManagerData === null || paymentManagerData === void 0 ? void 0 : paymentManagerData.parsed)) {
        throw `No payment manager found for marketplace with name ${marketplaceData.parsed.name}`;
    }
    const listerPaymentTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, listingData.parsed.paymentMint, listingData.parsed.lister, wallet.publicKey);
    const listerMintTokenAccountId = await findAta(mintId, listingData.parsed.lister, true);
    const buyerPaymentTokenAccountId = listingData.parsed.lister.toString() === buyer.toString()
        ? await findAta(listingData.parsed.paymentMint, buyer, true)
        : await withFindOrInitAssociatedTokenAccount(transaction, connection, listingData.parsed.paymentMint, buyer, wallet.publicKey);
    if (listingData.parsed.paymentMint.toString() === WSOL_MINT.toString()) {
        await withWrapSol(transaction, connection, emptyWallet(buyer), listingData.parsed.paymentAmount.toNumber(), true);
    }
    const buyerMintTokenAccountId = listingData.parsed.lister.toString() === buyer.toString()
        ? await findAta(mintId, buyer, true)
        : await withFindOrInitAssociatedTokenAccount(transaction, connection, mintId, buyer, wallet.publicKey);
    const feeCollectorTokenAccountId = await withFindOrInitAssociatedTokenAccount(transaction, connection, listingData.parsed.paymentMint, paymentManagerData === null || paymentManagerData === void 0 ? void 0 : paymentManagerData.parsed.feeCollector, wallet.publicKey);
    const mintMetadataId = await Metadata.getPDA(mintId);
    const [tokenManagerId] = await findTokenManagerAddress(mintId);
    const [transferReceiptId] = await findTransferReceiptId(tokenManagerId);
    const [transferId] = await findTransferAddress(mintId);
    const remainingAccountsForHandlePaymentWithRoyalties = await withRemainingAccountsForHandlePaymentWithRoyalties(transaction, connection, wallet, mintId, listingData.parsed.paymentMint, [listingData.parsed.lister.toString(), buyer.toString()]);
    const tokenManagerData = await getTokenManager(connection, tokenManagerId);
    if (!tokenManagerData) {
        throw `No token manager found for ${mintId.toString()}`;
    }
    const remainingAccountsForKind = await getRemainingAccountsForKind(mintId, tokenManagerData.parsed.kind);
    const remainingAccounts = [
        ...remainingAccountsForHandlePaymentWithRoyalties,
        ...remainingAccountsForKind,
    ];
    transaction.add(acceptListing(connection, wallet, marketplaceData.parsed.transferAuthority, listerPaymentTokenAccountId, listerMintTokenAccountId, listingData.parsed.lister, buyerPaymentTokenAccountId, buyerMintTokenAccountId, buyer, marketplaceData.pubkey, mintId, listingData.pubkey, tokenManagerId, mintMetadataId, transferReceiptId, transferId, marketplaceData.parsed.paymentManager, listingData.parsed.paymentMint, feeCollectorTokenAccountId, remainingAccounts));
    return transaction;
};
export const withWhitelistMarektplaces = async (transaction, connection, wallet, transferAuthorityName, marketplaceNames) => {
    const [transferAuthority] = await findTransferAuthorityAddress(transferAuthorityName);
    const marketplaceIds = (await Promise.all(marketplaceNames.map((name) => findMarketplaceAddress(name)))).map((el) => el[0]);
    transaction.add(whitelistMarkeplaces(connection, wallet, transferAuthority, marketplaceIds));
    return transaction;
};
export const withInitTransfer = async (transaction, connection, wallet, to, mintId, holderTokenAccountId, payer = wallet.publicKey) => {
    const [transferId] = await findTransferAddress(mintId);
    const [tokenManagerId] = await findTokenManagerAddress(mintId);
    transaction.add(initTransfer(connection, wallet, {
        to: to,
        transferId: transferId,
        tokenManagerId: tokenManagerId,
        holderTokenAccountId: holderTokenAccountId,
        holder: wallet.publicKey,
        payer: payer,
    }));
    return transaction;
};
export const withCancelTransfer = async (transaction, connection, wallet, mintId) => {
    const [transferId] = await findTransferAddress(mintId);
    const [tokenManagerId] = await findTokenManagerAddress(mintId);
    const checkTokenManager = await tryGetAccount(() => getTokenManager(connection, tokenManagerId));
    if (!checkTokenManager) {
        throw `No token manager found for mint id ${mintId.toString()}`;
    }
    transaction.add(cancelTransfer(connection, wallet, {
        transferId: transferId,
        tokenManagerId: tokenManagerId,
        holderTokenAccountId: checkTokenManager.parsed.recipientTokenAccount,
        holder: wallet.publicKey,
    }));
    return transaction;
};
export const withAcceptTransfer = async (transaction, connection, wallet, mintId, recipient, holder) => {
    const [transferId] = await findTransferAddress(mintId);
    const [tokenManagerId] = await findTokenManagerAddress(mintId);
    const [transferReceiptId] = await findTransferReceiptId(tokenManagerId);
    const [listingId] = await findListingAddress(mintId);
    const tokenManagerData = await tryGetAccount(() => getTokenManager(connection, tokenManagerId));
    if (!tokenManagerData) {
        throw `No token manager found for mint ${mintId.toString()}`;
    }
    if (!tokenManagerData.parsed.transferAuthority) {
        throw `No transfer autority found for mint id ${mintId.toString()}`;
    }
    const recipientTokenAccountId = await findAta(mintId, recipient, true);
    const remainingAccountsForTransfer = [
        ...(await getRemainingAccountsForKind(mintId, tokenManagerData.parsed.kind)),
        {
            pubkey: transferReceiptId,
            isSigner: false,
            isWritable: true,
        },
    ];
    transaction.add(acceptTransfer(connection, wallet, {
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
export const withRelease = async (transaction, connection, wallet, mintId, transferAuthorityId, holderTokenAccountId, payer = wallet.publicKey) => {
    const [tokenManagerId] = await findTokenManagerAddress(mintId);
    const checkTokenManager = await tryGetAccount(() => getTokenManager(connection, tokenManagerId));
    if (!checkTokenManager) {
        throw `No token manager found for mint id ${mintId.toString()}`;
    }
    const tokenManagerTokenAccount = await withFindOrInitAssociatedTokenAccount(transaction, connection, mintId, tokenManagerId, payer, true);
    const tokenManagerData = await getTokenManager(connection, tokenManagerId);
    const remainingAccountsForKind = await getRemainingAccountsForKind(mintId, tokenManagerData.parsed.kind);
    const remainingAccountsForReturn = await withRemainingAccountsForReturn(transaction, connection, wallet, tokenManagerData);
    transaction.add(release(connection, wallet, {
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
//# sourceMappingURL=marketplace.js.map