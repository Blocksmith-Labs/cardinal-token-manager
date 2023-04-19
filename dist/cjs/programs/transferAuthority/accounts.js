"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOfType = exports.getTransfersToUser = exports.getTransfersFromUser = exports.getTransfer = exports.getAllListings = exports.getListingsForIssuer = exports.getListingsForMarketplace = exports.getListing = exports.getAllMarketplaces = exports.getMarketplaceByName = exports.getMarketplace = exports.getAllTransferAuthorities = exports.getTransferAuthorityByName = exports.getTransferAuthority = void 0;
const anchor_1 = require("@project-serum/anchor");
const solana_contrib_1 = require("@saberhq/solana-contrib");
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const pda_1 = require("./pda");
//////// TRANSFER AUTHORITY ////////
const getTransferAuthority = async (connection, transferAuthorityId) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const parsed = await transferAuthorityProgram.account.transferAuthority.fetch(transferAuthorityId);
    return {
        parsed,
        pubkey: transferAuthorityId,
    };
};
exports.getTransferAuthority = getTransferAuthority;
const getTransferAuthorityByName = async (connection, name) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const [transferAuthorityId] = await (0, pda_1.findTransferAuthorityAddress)(name);
    const parsed = await transferAuthorityProgram.account.transferAuthority.fetch(transferAuthorityId);
    return {
        parsed,
        pubkey: transferAuthorityId,
    };
};
exports.getTransferAuthorityByName = getTransferAuthorityByName;
const getAllTransferAuthorities = async (connection) => (0, exports.getAllOfType)(connection, "transferAuthority");
exports.getAllTransferAuthorities = getAllTransferAuthorities;
//////// MARKETPLACE ////////
const getMarketplace = async (connection, marketplaceId) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const parsed = await transferAuthorityProgram.account.marketplace.fetch(marketplaceId);
    return {
        parsed,
        pubkey: marketplaceId,
    };
};
exports.getMarketplace = getMarketplace;
const getMarketplaceByName = async (connection, name) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const [marketplaceId] = await (0, pda_1.findMarketplaceAddress)(name);
    const parsed = await transferAuthorityProgram.account.marketplace.fetch(marketplaceId);
    return {
        parsed,
        pubkey: marketplaceId,
    };
};
exports.getMarketplaceByName = getMarketplaceByName;
const getAllMarketplaces = async (connection) => (0, exports.getAllOfType)(connection, "marketplace");
exports.getAllMarketplaces = getAllMarketplaces;
//////// LISTING ////////
const getListing = async (connection, mintId) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const [listingId] = await (0, pda_1.findListingAddress)(mintId);
    const parsed = await transferAuthorityProgram.account.listing.fetch(listingId);
    return {
        parsed,
        pubkey: listingId,
    };
};
exports.getListing = getListing;
const getListingsForMarketplace = async (connection, marketplaceId) => {
    const programAccounts = await connection.getProgramAccounts(constants_1.TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: anchor_1.utils.bytes.bs58.encode(anchor_1.BorshAccountsCoder.accountDiscriminator("listing")),
                },
            },
            { memcmp: { offset: 73, bytes: marketplaceId.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new anchor_1.BorshAccountsCoder(constants_1.TRANSFER_AUTHORITY_IDL);
    programAccounts.forEach((account) => {
        try {
            const data = coder.decode("listing", account.account.data);
            if (data) {
                datas.push({
                    ...account,
                    parsed: data,
                });
            }
            // eslint-disable-next-line no-empty
        }
        catch (e) { }
    });
    return datas.sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()));
};
exports.getListingsForMarketplace = getListingsForMarketplace;
const getListingsForIssuer = async (connection, issuerId) => {
    const programAccounts = await connection.getProgramAccounts(constants_1.TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: anchor_1.utils.bytes.bs58.encode(anchor_1.BorshAccountsCoder.accountDiscriminator("listing")),
                },
            },
            { memcmp: { offset: 9, bytes: issuerId.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new anchor_1.BorshAccountsCoder(constants_1.TRANSFER_AUTHORITY_IDL);
    programAccounts.forEach((account) => {
        try {
            const data = coder.decode("listing", account.account.data);
            if (data) {
                datas.push({
                    ...account,
                    parsed: data,
                });
            }
            // eslint-disable-next-line no-empty
        }
        catch (e) { }
    });
    return datas.sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()));
};
exports.getListingsForIssuer = getListingsForIssuer;
const getAllListings = async (connection) => (0, exports.getAllOfType)(connection, "listing");
exports.getAllListings = getAllListings;
//////// Transfer ////////
const getTransfer = async (connection, mintId) => {
    const provider = new anchor_1.AnchorProvider(connection, new solana_contrib_1.SignerWallet(web3_js_1.Keypair.generate()), {});
    const transferAuthorityProgram = new anchor_1.Program(constants_1.TRANSFER_AUTHORITY_IDL, constants_1.TRANSFER_AUTHORITY_ADDRESS, provider);
    const [transferId] = await (0, pda_1.findTransferAddress)(mintId);
    const parsed = await transferAuthorityProgram.account.transfer.fetch(transferId);
    return {
        parsed,
        pubkey: transferId,
    };
};
exports.getTransfer = getTransfer;
const getTransfersFromUser = async (connection, from) => {
    const programAccounts = await connection.getProgramAccounts(constants_1.TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: anchor_1.utils.bytes.bs58.encode(anchor_1.BorshAccountsCoder.accountDiscriminator("transfer")),
                },
            },
            { memcmp: { offset: 41, bytes: from.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new anchor_1.BorshAccountsCoder(constants_1.TRANSFER_AUTHORITY_IDL);
    programAccounts.forEach((account) => {
        try {
            const data = coder.decode("transfer", account.account.data);
            if (data) {
                datas.push({
                    ...account,
                    parsed: data,
                });
            }
            // eslint-disable-next-line no-empty
        }
        catch (e) { }
    });
    return datas.sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()));
};
exports.getTransfersFromUser = getTransfersFromUser;
const getTransfersToUser = async (connection, to) => {
    const programAccounts = await connection.getProgramAccounts(constants_1.TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: anchor_1.utils.bytes.bs58.encode(anchor_1.BorshAccountsCoder.accountDiscriminator("transfer")),
                },
            },
            { memcmp: { offset: 73, bytes: to.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new anchor_1.BorshAccountsCoder(constants_1.TRANSFER_AUTHORITY_IDL);
    programAccounts.forEach((account) => {
        try {
            const data = coder.decode("transfer", account.account.data);
            if (data) {
                datas.push({
                    ...account,
                    parsed: data,
                });
            }
            // eslint-disable-next-line no-empty
        }
        catch (e) { }
    });
    return datas.sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()));
};
exports.getTransfersToUser = getTransfersToUser;
//////// utils ////////
const getAllOfType = async (connection, key) => {
    const programAccounts = await connection.getProgramAccounts(constants_1.TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: anchor_1.utils.bytes.bs58.encode(anchor_1.BorshAccountsCoder.accountDiscriminator(key)),
                },
            },
        ],
    });
    const datas = [];
    const coder = new anchor_1.BorshAccountsCoder(constants_1.TRANSFER_AUTHORITY_IDL);
    programAccounts.forEach((account) => {
        try {
            const data = coder.decode(key, account.account.data);
            if (data) {
                datas.push({
                    ...account,
                    parsed: data,
                });
            }
            // eslint-disable-next-line no-empty
        }
        catch (e) { }
    });
    return datas.sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()));
};
exports.getAllOfType = getAllOfType;
//# sourceMappingURL=accounts.js.map