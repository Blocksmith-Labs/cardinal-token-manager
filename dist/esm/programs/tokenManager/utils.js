import {
  decodeIdlAccount,
  findMintEditionId,
  findMintMetadataId,
  METADATA_PROGRAM_ID,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
import {
  PREFIX as TOKEN_AUTH_RULESET_PREFIX,
  PROGRAM_ID as TOKEN_AUTH_RULES_ID,
} from "@metaplex-foundation/mpl-token-auth-rules";
import {
  Metadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  CRANK_KEY,
  InvalidationType,
  // TOKEN_MANAGER_ADDRESS,
  TOKEN_MANAGER_IDL,
  TokenManagerKind,
  TokenManagerState,
} from ".";
import {
  findMintManagerId,
  findTokenManagerAddress,
  findTransferReceiptId,
} from "./pda";
export const getRemainingAccountsForKind = (mintId, tokenManagerKind) => {
  if (
    tokenManagerKind === TokenManagerKind.Managed ||
    tokenManagerKind === TokenManagerKind.Permissioned
  ) {
    return [
      {
        pubkey: findMintManagerId(mintId),
        isSigner: false,
        isWritable: true,
      },
    ];
  } else if (tokenManagerKind === TokenManagerKind.Edition) {
    return [
      {
        pubkey: findMintEditionId(mintId),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: METADATA_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
    ];
  } else {
    return [];
  }
};
export const getRemainingAccountsForUnissue = (
  tokenManagerId,
  tokenManagerData,
  metadata
) => {
  var _a, _b, _c;
  const remainingAccounts = [];
  if (
    tokenManagerData.kind !== TokenManagerKind.Programmable &&
    (metadata === null || metadata === void 0
      ? void 0
      : metadata.tokenStandard) === TokenStandard.ProgrammableNonFungible
  ) {
    remainingAccounts.push({
      pubkey: findMintMetadataId(tokenManagerData.mint),
      isSigner: false,
      isWritable: false,
    });
  }
  if (
    (_a =
      metadata === null || metadata === void 0
        ? void 0
        : metadata.programmableConfig) === null || _a === void 0
      ? void 0
      : _a.ruleSet
  ) {
    remainingAccounts.push(
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ...remainingAccountForProgrammable(
        tokenManagerData.mint,
        getAssociatedTokenAddressSync(
          tokenManagerData.mint,
          tokenManagerId,
          true
        ),
        getAssociatedTokenAddressSync(
          tokenManagerData.mint,
          tokenManagerData.issuer,
          true
        ),
        (_c =
          (_b =
            metadata === null || metadata === void 0
              ? void 0
              : metadata.programmableConfig) === null || _b === void 0
            ? void 0
            : _b.ruleSet) !== null && _c !== void 0
          ? _c
          : undefined
      )
    );
  }
  return remainingAccounts;
};
/**
 * Convenience method to get remaining accounts for invalidation
 * NOTE: This ignores token account creation and assumes that is handled outside. Use withRemainingAccountsForInvalidate
 * to include token account creation in the current transaction
 * @param connection
 * @param mintId
 * @returns
 */
export const getRemainingAccountsForInvalidate = async (
  connection,
  wallet,
  mintId
) => {
  const tokenManagerId = findTokenManagerAddress(mintId);
  const [tokenManagerInfo, metadataInfo] =
    await connection.getMultipleAccountsInfo([
      tokenManagerId,
      findMintMetadataId(mintId),
    ]);
  if (!tokenManagerInfo) throw "Token manager not found";
  const tokenManagerData = decodeIdlAccount(
    tokenManagerInfo,
    "tokenManager",
    TOKEN_MANAGER_IDL
  );
  if (!metadataInfo) throw "Metadata not found";
  const metadata = Metadata.deserialize(metadataInfo.data)[0];
  const receipientTokenAccount = await getAccount(
    connection,
    tokenManagerData.parsed.recipientTokenAccount
  );
  return await withRemainingAccountsForInvalidate(
    new Transaction(),
    connection,
    wallet,
    mintId,
    { ...tokenManagerData, pubkey: tokenManagerId },
    receipientTokenAccount.owner,
    metadata
  );
};
export const withRemainingAccountsForInvalidate = async (
  transaction,
  connection,
  wallet,
  mintId,
  tokenManagerData,
  recipientTokenAccountOwnerId,
  metadata
) => {
  var _a, _b, _c, _d;
  const remainingAccounts = [];
  if (
    tokenManagerData.parsed.kind !== TokenManagerKind.Programmable &&
    (metadata === null || metadata === void 0
      ? void 0
      : metadata.tokenStandard) === TokenStandard.ProgrammableNonFungible
  ) {
    // update kind
    tokenManagerData.parsed.kind = TokenManagerKind.Programmable;
    remainingAccounts.push({
      pubkey: findMintMetadataId(mintId),
      isSigner: false,
      isWritable: false,
    });
  }
  if (tokenManagerData.parsed.state === TokenManagerState.Claimed) {
    remainingAccounts.push(
      ...getRemainingAccountsForKind(mintId, tokenManagerData.parsed.kind)
    );
  }
  if (
    tokenManagerData.parsed.kind === TokenManagerKind.Programmable &&
    (tokenManagerData.parsed.invalidationType === InvalidationType.Release ||
      tokenManagerData.parsed.invalidationType === InvalidationType.Reissue)
  ) {
    if (
      !((_a =
        metadata === null || metadata === void 0
          ? void 0
          : metadata.programmableConfig) === null || _a === void 0
        ? void 0
        : _a.ruleSet)
    )
      throw "Ruleset not specified";
    const releaseAccounts = remainingAccountForProgrammableUnlockAndTransfer(
      recipientTokenAccountOwnerId,
      wallet.publicKey,
      mintId,
      tokenManagerData.parsed.recipientTokenAccount,
      (_b =
        metadata === null || metadata === void 0
          ? void 0
          : metadata.programmableConfig) === null || _b === void 0
        ? void 0
        : _b.ruleSet
    );
    remainingAccounts.push(...releaseAccounts);
  } else {
    const returnAccounts = await withRemainingAccountsForReturn(
      transaction,
      connection,
      wallet,
      tokenManagerData,
      recipientTokenAccountOwnerId,
      (_d =
        (_c =
          metadata === null || metadata === void 0
            ? void 0
            : metadata.programmableConfig) === null || _c === void 0
          ? void 0
          : _c.ruleSet) !== null && _d !== void 0
        ? _d
        : undefined
    );
    remainingAccounts.push(...returnAccounts);
  }
  return remainingAccounts;
};
export const withRemainingAccountsForReturn = async (
  transaction,
  connection,
  wallet,
  tokenManagerData,
  recipientTokenAccountOwnerId,
  rulesetId
) => {
  var _a, _b;
  const {
    issuer,
    mint,
    claimApprover,
    recipientTokenAccount,
    invalidationType,
    kind,
    receiptMint,
    state,
  } = tokenManagerData.parsed;
  if (
    invalidationType === InvalidationType.Vest &&
    state === TokenManagerState.Issued
  ) {
    if (!claimApprover) throw "Claim approver must be set";
    const claimApproverTokenAccountId =
      await withFindOrInitAssociatedTokenAccount(
        transaction,
        connection,
        mint,
        claimApprover,
        wallet.publicKey,
        true
      );
    return [
      {
        pubkey: claimApproverTokenAccountId,
        isSigner: false,
        isWritable: true,
      },
    ];
  } else if (
    invalidationType === InvalidationType.Return ||
    state === TokenManagerState.Issued
  ) {
    if (kind === TokenManagerKind.Programmable || rulesetId) {
      // if (!rulesetId) throw "Ruleset not specified";
      if (!recipientTokenAccountOwnerId)
        throw "Recipient token account owner not specified";
      const remainingAccounts = [];
      let returnTokenAccountId;
      if (receiptMint) {
        const receiptMintLargestAccount =
          await connection.getTokenLargestAccounts(receiptMint);
        // get holder of receipt mint
        const receiptTokenAccountId =
          (_a = receiptMintLargestAccount.value[0]) === null || _a === void 0
            ? void 0
            : _a.address;
        if (!receiptTokenAccountId) throw new Error("No token accounts found");
        const receiptTokenAccount = await getAccount(
          connection,
          receiptTokenAccountId
        );
        // get ATA for this mint of receipt mint holder
        returnTokenAccountId = await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          mint,
          receiptTokenAccount.owner,
          wallet.publicKey,
          true
        );
        remainingAccounts.push(
          {
            pubkey: returnTokenAccountId,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: receiptTokenAccount.owner,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: receiptTokenAccountId,
            isSigner: false,
            isWritable: true,
          }
        );
      } else {
        returnTokenAccountId = await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          mint,
          issuer,
          wallet.publicKey,
          true
        );
        remainingAccounts.push(
          {
            pubkey: returnTokenAccountId,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: issuer,
            isSigner: false,
            isWritable: false,
          }
        );
      }
      remainingAccounts.push(
        {
          pubkey: recipientTokenAccountOwnerId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: wallet.publicKey,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: findTokenRecordId(
            mint,
            getAssociatedTokenAddressSync(mint, tokenManagerData.pubkey, true)
          ),
          isSigner: false,
          isWritable: true,
        },
        ...remainingAccountForProgrammable(
          mint,
          recipientTokenAccount,
          returnTokenAccountId,
          rulesetId
        )
      );
      return remainingAccounts;
    } else {
      if (receiptMint) {
        const receiptMintLargestAccount =
          await connection.getTokenLargestAccounts(receiptMint);
        // get holder of receipt mint
        const receiptTokenAccountId =
          (_b = receiptMintLargestAccount.value[0]) === null || _b === void 0
            ? void 0
            : _b.address;
        if (!receiptTokenAccountId) throw new Error("No token accounts found");
        const receiptTokenAccount = await getAccount(
          connection,
          receiptTokenAccountId
        );
        // get ATA for this mint of receipt mint holder
        const returnTokenAccountId = await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          mint,
          receiptTokenAccount.owner,
          wallet.publicKey,
          true
        );
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
      } else {
        const issuerTokenAccountId = await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          mint,
          issuer,
          wallet.publicKey,
          true
        );
        return [
          {
            pubkey: issuerTokenAccountId,
            isSigner: false,
            isWritable: true,
          },
        ];
      }
    }
  } else {
    return [];
  }
};
export const getRemainingAccountsForTransfer = (
  transferAuthority,
  tokenManagerId
) => {
  if (transferAuthority) {
    const transferReceiptId = findTransferReceiptId(tokenManagerId);
    return [
      {
        pubkey: transferReceiptId,
        isSigner: false,
        isWritable: true,
      },
    ];
  } else {
    return [];
  }
};
export const remainingAccountForProgrammable = (
  mintId,
  fromTokenAccountId,
  toTokenAccountId,
  rulesetId
) => {
  return [
    {
      pubkey: mintId,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: findMintMetadataId(mintId),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: findMintEditionId(mintId),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: findTokenRecordId(mintId, fromTokenAccountId),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: findTokenRecordId(mintId, toTokenAccountId),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_AUTH_RULES_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey:
        rulesetId !== null && rulesetId !== void 0
          ? rulesetId
          : METADATA_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: METADATA_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ];
};
export const remainingAccountForProgrammableUnlockAndTransfer = (
  recipient,
  payer,
  mintId,
  fromTokenAccountId,
  rulesetId
) => {
  return [
    {
      pubkey: recipient,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: findTokenRecordId(
        mintId,
        getAssociatedTokenAddressSync(
          mintId,
          findTokenManagerAddress(mintId),
          true
        )
      ),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: mintId,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: findMintMetadataId(mintId),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: findMintEditionId(mintId),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: findTokenRecordId(mintId, fromTokenAccountId),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_AUTH_RULES_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: rulesetId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: METADATA_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ];
};
export const getRemainingAccountsForIssue = (
  tokenManagerKind,
  mintId,
  issuerTokenAccountId,
  tokenManagerTokenAccountId,
  rulesetId
) => {
  if (tokenManagerKind === TokenManagerKind.Permissioned) {
    return [
      {
        pubkey: CRANK_KEY,
        isSigner: false,
        isWritable: true,
      },
    ];
  } else if (tokenManagerKind === TokenManagerKind.Programmable) {
    if (!rulesetId) throw "Ruleset not specified";
    return remainingAccountForProgrammable(
      mintId,
      issuerTokenAccountId,
      tokenManagerTokenAccountId,
      rulesetId
    );
  } else {
    return [];
  }
};
export const getRemainingAccountsForClaim = (
  tokenManagerData,
  recipientTokenAccountId,
  metadata,
  claimReceiptId
) => {
  var _a, _b;
  const remainingAccounts = [];
  if (
    tokenManagerData.parsed.kind !== TokenManagerKind.Programmable &&
    (metadata === null || metadata === void 0
      ? void 0
      : metadata.tokenStandard) === TokenStandard.ProgrammableNonFungible
  ) {
    // update kind
    tokenManagerData.parsed.kind = TokenManagerKind.Programmable;
    remainingAccounts.push({
      pubkey: findMintMetadataId(tokenManagerData.parsed.mint),
      isSigner: false,
      isWritable: false,
    });
  }
  if (
    tokenManagerData.parsed.kind === TokenManagerKind.Managed ||
    tokenManagerData.parsed.kind === TokenManagerKind.Permissioned
  ) {
    const mintManagerId = findMintManagerId(tokenManagerData.parsed.mint);
    remainingAccounts.push({
      pubkey: mintManagerId,
      isSigner: false,
      isWritable: true,
    });
  } else if (tokenManagerData.parsed.kind === TokenManagerKind.Edition) {
    const editionId = findMintEditionId(tokenManagerData.parsed.mint);
    remainingAccounts.push(
      {
        pubkey: editionId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: METADATA_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      }
    );
  } else if (tokenManagerData.parsed.kind === TokenManagerKind.Programmable) {
    if (
      !((_a =
        metadata === null || metadata === void 0
          ? void 0
          : metadata.programmableConfig) === null || _a === void 0
        ? void 0
        : _a.ruleSet)
    )
      throw "Ruleset not specified";
    remainingAccounts.push(
      ...remainingAccountForProgrammable(
        tokenManagerData.parsed.mint,
        getAssociatedTokenAddressSync(
          tokenManagerData.parsed.mint,
          tokenManagerData.pubkey,
          true
        ),
        recipientTokenAccountId,
        (_b =
          metadata === null || metadata === void 0
            ? void 0
            : metadata.programmableConfig) === null || _b === void 0
          ? void 0
          : _b.ruleSet
      )
    );
  }
  if (claimReceiptId) {
    remainingAccounts.push({
      pubkey: claimReceiptId,
      isSigner: false,
      isWritable: true,
    });
  }
  return remainingAccounts;
};
export function findTokenRecordId(mint, token) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("token_record"),
      token.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];
}
export const findRuleSetId = (authority, name) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(TOKEN_AUTH_RULESET_PREFIX),
      authority.toBuffer(),
      Buffer.from(name),
    ],
    TOKEN_AUTH_RULES_ID
  )[0];
};
//# sourceMappingURL=utils.js.map
