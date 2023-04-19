import { AnchorProvider, BorshAccountsCoder, Program, utils, } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair } from "@solana/web3.js";
import { TRANSFER_AUTHORITY_ADDRESS, TRANSFER_AUTHORITY_IDL, } from "./constants";
import { findListingAddress, findMarketplaceAddress, findTransferAddress, findTransferAuthorityAddress, } from "./pda";
//////// TRANSFER AUTHORITY ////////
export const getTransferAuthority = async (connection, transferAuthorityId) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const transferAuthorityProgram = new Program(TRANSFER_AUTHORITY_IDL, TRANSFER_AUTHORITY_ADDRESS, provider);
    const parsed = await transferAuthorityProgram.account.transferAuthority.fetch(transferAuthorityId);
    return {
        parsed,
        pubkey: transferAuthorityId,
    };
};
export const getTransferAuthorityByName = async (connection, name) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const transferAuthorityProgram = new Program(TRANSFER_AUTHORITY_IDL, TRANSFER_AUTHORITY_ADDRESS, provider);
    const [transferAuthorityId] = await findTransferAuthorityAddress(name);
    const parsed = await transferAuthorityProgram.account.transferAuthority.fetch(transferAuthorityId);
    return {
        parsed,
        pubkey: transferAuthorityId,
    };
};
export const getAllTransferAuthorities = async (connection) => getAllOfType(connection, "transferAuthority");
//////// MARKETPLACE ////////
export const getMarketplace = async (connection, marketplaceId) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const transferAuthorityProgram = new Program(TRANSFER_AUTHORITY_IDL, TRANSFER_AUTHORITY_ADDRESS, provider);
    const parsed = await transferAuthorityProgram.account.marketplace.fetch(marketplaceId);
    return {
        parsed,
        pubkey: marketplaceId,
    };
};
export const getMarketplaceByName = async (connection, name) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const transferAuthorityProgram = new Program(TRANSFER_AUTHORITY_IDL, TRANSFER_AUTHORITY_ADDRESS, provider);
    const [marketplaceId] = await findMarketplaceAddress(name);
    const parsed = await transferAuthorityProgram.account.marketplace.fetch(marketplaceId);
    return {
        parsed,
        pubkey: marketplaceId,
    };
};
export const getAllMarketplaces = async (connection) => getAllOfType(connection, "marketplace");
//////// LISTING ////////
export const getListing = async (connection, mintId) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const transferAuthorityProgram = new Program(TRANSFER_AUTHORITY_IDL, TRANSFER_AUTHORITY_ADDRESS, provider);
    const [listingId] = await findListingAddress(mintId);
    const parsed = await transferAuthorityProgram.account.listing.fetch(listingId);
    return {
        parsed,
        pubkey: listingId,
    };
};
export const getListingsForMarketplace = async (connection, marketplaceId) => {
    const programAccounts = await connection.getProgramAccounts(TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: utils.bytes.bs58.encode(BorshAccountsCoder.accountDiscriminator("listing")),
                },
            },
            { memcmp: { offset: 73, bytes: marketplaceId.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new BorshAccountsCoder(TRANSFER_AUTHORITY_IDL);
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
export const getListingsForIssuer = async (connection, issuerId) => {
    const programAccounts = await connection.getProgramAccounts(TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: utils.bytes.bs58.encode(BorshAccountsCoder.accountDiscriminator("listing")),
                },
            },
            { memcmp: { offset: 9, bytes: issuerId.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new BorshAccountsCoder(TRANSFER_AUTHORITY_IDL);
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
export const getAllListings = async (connection) => getAllOfType(connection, "listing");
//////// Transfer ////////
export const getTransfer = async (connection, mintId) => {
    const provider = new AnchorProvider(connection, new SignerWallet(Keypair.generate()), {});
    const transferAuthorityProgram = new Program(TRANSFER_AUTHORITY_IDL, TRANSFER_AUTHORITY_ADDRESS, provider);
    const [transferId] = await findTransferAddress(mintId);
    const parsed = await transferAuthorityProgram.account.transfer.fetch(transferId);
    return {
        parsed,
        pubkey: transferId,
    };
};
export const getTransfersFromUser = async (connection, from) => {
    const programAccounts = await connection.getProgramAccounts(TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: utils.bytes.bs58.encode(BorshAccountsCoder.accountDiscriminator("transfer")),
                },
            },
            { memcmp: { offset: 41, bytes: from.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new BorshAccountsCoder(TRANSFER_AUTHORITY_IDL);
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
export const getTransfersToUser = async (connection, to) => {
    const programAccounts = await connection.getProgramAccounts(TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: utils.bytes.bs58.encode(BorshAccountsCoder.accountDiscriminator("transfer")),
                },
            },
            { memcmp: { offset: 73, bytes: to.toBase58() } },
        ],
    });
    const datas = [];
    const coder = new BorshAccountsCoder(TRANSFER_AUTHORITY_IDL);
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
//////// utils ////////
export const getAllOfType = async (connection, key) => {
    const programAccounts = await connection.getProgramAccounts(TRANSFER_AUTHORITY_ADDRESS, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: utils.bytes.bs58.encode(BorshAccountsCoder.accountDiscriminator(key)),
                },
            },
        ],
    });
    const datas = [];
    const coder = new BorshAccountsCoder(TRANSFER_AUTHORITY_IDL);
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
//# sourceMappingURL=accounts.js.map