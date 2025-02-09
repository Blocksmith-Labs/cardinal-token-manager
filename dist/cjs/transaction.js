"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withReplaceInvalidator =
  exports.withMigrate =
  exports.withSend =
  exports.withUndelegate =
  exports.withDelegate =
  exports.withTransfer =
  exports.withUpdateMaxExpiration =
  exports.withResetExpiration =
  exports.withExtendUsages =
  exports.withExtendExpiration =
  exports.withUse =
  exports.withReturn =
  exports.withInvalidate =
  exports.withUnissueToken =
  exports.withClaimToken =
  exports.withIssueToken =
    void 0;
const common_1 = require("@cardinal/common");
const creator_standard_1 = require("@cardinal/creator-standard");
const paymentManager_1 = require("./programs/paymentManager");
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const anchor_1 = require("@project-serum/anchor");
const token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const programs_1 = require("./programs");
const claimApprover_1 = require("./programs/claimApprover");
const pda_1 = require("./programs/claimApprover/pda");
const timeInvalidator_1 = require("./programs/timeInvalidator");
const pda_2 = require("./programs/timeInvalidator/pda");
const utils_1 = require("./programs/timeInvalidator/utils");
const tokenManager_1 = require("./programs/tokenManager");
const accounts_1 = require("./programs/tokenManager/accounts");
const pda_3 = require("./programs/tokenManager/pda");
const utils_2 = require("./programs/tokenManager/utils");
const accounts_2 = require("./programs/transferAuthority/accounts");
const pda_4 = require("./programs/transferAuthority/pda");
const useInvalidator_1 = require("./programs/useInvalidator");
const pda_5 = require("./programs/useInvalidator/pda");
const utils_3 = require("./programs/paymentManager/utils");
/**
 * Main method for issuing any managed token
 * Allows for optional payment, optional usages or expiration and includes a otp for private links
 * @param connection
 * @param wallet
 * @param parameters
 * @returns Transaction, public key for the created token manager and a otp if necessary for private links
 */
const withIssueToken = async (
  transaction,
  connection,
  wallet,
  {
    claimPayment,
    timeInvalidation,
    useInvalidation,
    mint,
    issuerTokenAccountId,
    amount = new anchor_1.BN(1),
    transferAuthorityInfo,
    kind = tokenManager_1.TokenManagerKind.Managed,
    invalidationType = tokenManager_1.InvalidationType.Return,
    visibility = "public",
    permissionedClaimApprover,
    receiptOptions = undefined,
    customInvalidators = undefined,
    rulesetId = undefined,
  },
  payer = wallet.publicKey
) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const caProgram = (0, claimApprover_1.claimApproverProgram)(
    connection,
    wallet
  );
  const tmeInvalidatorProgram = (0, timeInvalidator_1.timeInvalidatorProgram)(
    connection,
    wallet
  );
  const usgInvalidatorProgram = (0, useInvalidator_1.useInvalidatorProgram)(
    connection,
    wallet
  );
  // create mint manager
  if (
    kind === tokenManager_1.TokenManagerKind.Managed ||
    kind === tokenManager_1.TokenManagerKind.Permissioned
  ) {
    const mintManagerId = (0, pda_3.findMintManagerId)(mint);
    const mintManagerData = await (0, common_1.tryGetAccount)(() =>
      programs_1.tokenManager.accounts.getMintManager(connection, mintManagerId)
    );
    if (!mintManagerData) {
      const mintManagerIx = await tmManagerProgram.methods
        .createMintManager()
        .accounts({
          mintManager: mintManagerId,
          mint: mint,
          freezeAuthority: wallet.publicKey,
          payer: wallet.publicKey,
          tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
          systemProgram: web3_js_1.SystemProgram.programId,
        })
        .instruction();
      transaction.add(mintManagerIx);
    }
  }
  // init token manager
  const numInvalidator =
    (customInvalidators ? customInvalidators.length : 0) +
    (useInvalidation && timeInvalidation
      ? 2
      : useInvalidation || timeInvalidation
      ? 1
      : 0) +
    ((
      transferAuthorityInfo === null || transferAuthorityInfo === void 0
        ? void 0
        : transferAuthorityInfo.creator
    )
      ? 1
      : 0);
  const tokenManagerId = (0, pda_3.findTokenManagerAddress)(mint);
  const mintCounterId = (0, pda_3.findMintCounterId)(mint);
  const tokenManagerIx = await tmManagerProgram.methods
    .init({
      amount: amount,
      kind: kind,
      invalidationType: invalidationType,
      numInvalidators: numInvalidator,
    })
    .accounts({
      tokenManager: tokenManagerId,
      mintCounter: mintCounterId,
      mint: mint,
      issuer: wallet.publicKey,
      payer: wallet.publicKey,
      issuerTokenAccount: issuerTokenAccountId,
      systemProgram: web3_js_1.SystemProgram.programId,
    })
    .instruction();
  transaction.add(tokenManagerIx);
  if (transferAuthorityInfo) {
    const checkTransferAuthority = await (0, common_1.tryGetAccount)(() =>
      (0, accounts_2.getTransferAuthorityByName)(
        connection,
        transferAuthorityInfo.transferAuthorityName
      )
    );
    if (
      !(checkTransferAuthority === null || checkTransferAuthority === void 0
        ? void 0
        : checkTransferAuthority.parsed)
    ) {
      throw `No transfer authority with name ${transferAuthorityInfo.transferAuthorityName} found`;
    }
    const setTransferAuthorityIx = await tmManagerProgram.methods
      .setTransferAuthority(checkTransferAuthority.pubkey)
      .accounts({
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
      })
      .instruction();
    transaction.add(setTransferAuthorityIx);
    if (transferAuthorityInfo.creator) {
      const adInvalidatorIx = await tmManagerProgram.methods
        .addInvalidator(transferAuthorityInfo.creator)
        .accounts({
          tokenManager: tokenManagerId,
          issuer: wallet.publicKey,
        })
        .instruction();
      transaction.add(adInvalidatorIx);
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
    const paidClaimApproverId = (0, pda_1.findClaimApproverAddress)(
      tokenManagerId
    );
    const paidClaimApproverIx = await caProgram.methods
      .init({
        paymentMint: claimPayment.paymentMint,
        paymentAmount: new anchor_1.BN(claimPayment.paymentAmount),
        paymentManager:
          claimPayment.paymentManager ||
          claimApprover_1.defaultPaymentManagerId,
        collector: claimPayment.collector || tokenManager_1.CRANK_KEY,
      })
      .accounts({
        tokenManager: tokenManagerId,
        claimApprover: paidClaimApproverId,
        issuer: wallet.publicKey,
        payer: payer !== null && payer !== void 0 ? payer : wallet.publicKey,
        systemProgram: web3_js_1.SystemProgram.programId,
      })
      .instruction();
    transaction.add(paidClaimApproverIx);
    const setClaimApproverIx = await tmManagerProgram.methods
      .setClaimApprover(paidClaimApproverId)
      .accounts({
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
      })
      .instruction();
    transaction.add(setClaimApproverIx);
  } else if (visibility === "private") {
    otp = web3_js_1.Keypair.generate();
    const setClaimApproverIx = await tmManagerProgram.methods
      .setClaimApprover(otp.publicKey)
      .accounts({
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
      })
      .instruction();
    transaction.add(setClaimApproverIx);
  } else if (visibility === "permissioned") {
    if (!permissionedClaimApprover) {
      throw "Claim approver is not specified for permissioned link";
    }
    const setClaimApproverIx = await tmManagerProgram.methods
      .setClaimApprover(permissionedClaimApprover)
      .accounts({
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
      })
      .instruction();
    transaction.add(setClaimApproverIx);
  }
  //////////////////////////////
  /////// time invalidator /////
  //////////////////////////////
  if (timeInvalidation) {
    const timeInvalidatorId = (0, pda_2.findTimeInvalidatorAddress)(
      tokenManagerId
    );
    const timeInvalidatorIx = await tmeInvalidatorProgram.methods
      .init({
        collector: timeInvalidation.collector || tokenManager_1.CRANK_KEY,
        paymentManager:
          timeInvalidation.paymentManager ||
          claimApprover_1.defaultPaymentManagerId,
        durationSeconds:
          timeInvalidation.durationSeconds !== undefined
            ? new anchor_1.BN(timeInvalidation.durationSeconds)
            : null,
        extensionPaymentAmount:
          ((_a = timeInvalidation.extension) === null || _a === void 0
            ? void 0
            : _a.extensionPaymentAmount) !== undefined
            ? new anchor_1.BN(
                (_b = timeInvalidation.extension) === null || _b === void 0
                  ? void 0
                  : _b.extensionPaymentAmount
              )
            : null,
        extensionDurationSeconds:
          ((_c = timeInvalidation.extension) === null || _c === void 0
            ? void 0
            : _c.extensionDurationSeconds) !== undefined
            ? new anchor_1.BN(
                (_d = timeInvalidation.extension) === null || _d === void 0
                  ? void 0
                  : _d.extensionDurationSeconds
              )
            : null,
        extensionPaymentMint:
          ((_e = timeInvalidation.extension) === null || _e === void 0
            ? void 0
            : _e.extensionPaymentMint) || null,
        maxExpiration:
          timeInvalidation.maxExpiration !== undefined
            ? new anchor_1.BN(timeInvalidation.maxExpiration)
            : null,
        disablePartialExtension:
          ((_f = timeInvalidation.extension) === null || _f === void 0
            ? void 0
            : _f.disablePartialExtension) || null,
      })
      .accounts({
        tokenManager: tokenManagerId,
        timeInvalidator: timeInvalidatorId,
        issuer: wallet.publicKey,
        payer: wallet.publicKey,
        systemProgram: web3_js_1.SystemProgram.programId,
      })
      .instruction();
    transaction.add(timeInvalidatorIx);
    const addInvalidatorIx = await tmManagerProgram.methods
      .addInvalidator(timeInvalidatorId)
      .accounts({
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
      })
      .instruction();
    transaction.add(addInvalidatorIx);
  } else {
    const timeInvalidatorId = (0, pda_2.findTimeInvalidatorAddress)(
      tokenManagerId
    );
    const timeInvalidatorData = await (0, common_1.tryGetAccount)(() =>
      programs_1.timeInvalidator.accounts.getTimeInvalidator(
        connection,
        timeInvalidatorId
      )
    );
    if (timeInvalidatorData) {
      const closeIx = await tmeInvalidatorProgram.methods
        .close()
        .accounts({
          tokenManager: tokenManagerId,
          timeInvalidator: timeInvalidatorId,
          collector: timeInvalidatorData.parsed.collector,
          closer: wallet.publicKey,
        })
        .instruction();
      transaction.add(closeIx);
    }
  }
  //////////////////////////////
  /////////// usages ///////////
  //////////////////////////////
  if (useInvalidation) {
    const useInvalidatorId = (0, pda_5.findUseInvalidatorAddress)(
      tokenManagerId
    );
    const useInvalidatorIx = await usgInvalidatorProgram.methods
      .init({
        collector: useInvalidation.collector || tokenManager_1.CRANK_KEY,
        paymentManager:
          useInvalidation.paymentManager ||
          claimApprover_1.defaultPaymentManagerId,
        totalUsages: useInvalidation.totalUsages
          ? new anchor_1.BN(useInvalidation.totalUsages)
          : null,
        maxUsages: (
          (_g = useInvalidation.extension) === null || _g === void 0
            ? void 0
            : _g.maxUsages
        )
          ? new anchor_1.BN(
              (_h = useInvalidation.extension) === null || _h === void 0
                ? void 0
                : _h.maxUsages
            )
          : null,
        useAuthority: useInvalidation.useAuthority || null,
        extensionPaymentAmount: (
          (_j = useInvalidation.extension) === null || _j === void 0
            ? void 0
            : _j.extensionPaymentAmount
        )
          ? new anchor_1.BN(
              (_k = useInvalidation.extension) === null || _k === void 0
                ? void 0
                : _k.extensionPaymentAmount
            )
          : null,
        extensionPaymentMint:
          ((_l = useInvalidation.extension) === null || _l === void 0
            ? void 0
            : _l.extensionPaymentMint) || null,
        extensionUsages: (
          (_m = useInvalidation.extension) === null || _m === void 0
            ? void 0
            : _m.extensionUsages
        )
          ? new anchor_1.BN(useInvalidation.extension.extensionUsages)
          : null,
      })
      .accounts({
        tokenManager: tokenManagerId,
        useInvalidator: useInvalidatorId,
        issuer: wallet.publicKey,
        payer: wallet.publicKey,
        systemProgram: web3_js_1.SystemProgram.programId,
      })
      .instruction();
    transaction.add(useInvalidatorIx);
    const addInvalidatorIx = await tmManagerProgram.methods
      .addInvalidator(useInvalidatorId)
      .accounts({
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
      })
      .instruction();
    transaction.add(addInvalidatorIx);
  } else {
    const useInvalidatorId =
      programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId);
    const useInvalidatorData = await (0, common_1.tryGetAccount)(() =>
      programs_1.useInvalidator.accounts.getUseInvalidator(
        connection,
        useInvalidatorId
      )
    );
    if (useInvalidatorData) {
      const closeIx = await usgInvalidatorProgram.methods
        .close()
        .accounts({
          tokenManager: tokenManagerId,
          useInvalidator: useInvalidatorId,
          collector: useInvalidatorData.parsed.collector,
          closer: wallet.publicKey,
        })
        .instruction();
      transaction.add(closeIx);
    }
  }
  /////////////////////////////////////////
  //////////// custom invalidators ////////
  /////////////////////////////////////////
  if (customInvalidators) {
    for (const invalidator of customInvalidators) {
      const addInvalidatorIx = await tmManagerProgram.methods
        .addInvalidator(invalidator)
        .accounts({
          tokenManager: tokenManagerId,
          issuer: wallet.publicKey,
        })
        .instruction();
      transaction.add(addInvalidatorIx);
    }
  }
  // issuer
  const tokenManagerTokenAccountId = await (0,
  common_1.withFindOrInitAssociatedTokenAccount)(
    transaction,
    connection,
    mint,
    tokenManagerId,
    payer,
    true
  );
  const issueIx = await tmManagerProgram.methods
    .issue()
    .accounts({
      tokenManager: tokenManagerId,
      tokenManagerTokenAccount: tokenManagerTokenAccountId,
      issuer: wallet.publicKey,
      issuerTokenAccount: issuerTokenAccountId,
      payer: wallet.publicKey,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
      systemProgram: web3_js_1.SystemProgram.programId,
    })
    .remainingAccounts(
      (0, utils_2.getRemainingAccountsForIssue)(
        kind,
        mint,
        issuerTokenAccountId,
        tokenManagerTokenAccountId,
        rulesetId
      )
    )
    .instruction();
  transaction.add(issueIx);
  //////////////////////////////
  //////////// index ///////////
  //////////////////////////////
  if (receiptOptions) {
    const { receiptMintKeypair } = receiptOptions;
    const receiptMintMetadataId = (0, common_1.findMintMetadataId)(
      receiptMintKeypair.publicKey
    );
    const recipientTokenAccountId = await (0, common_1.findAta)(
      receiptMintKeypair.publicKey,
      wallet.publicKey
    );
    const receiptManagerId = (0, pda_3.findReceiptMintManagerId)();
    const claimReceiptMintIx = await tmManagerProgram.methods
      .claimReceiptMint("receipt")
      .accounts({
        tokenManager: tokenManagerId,
        issuer: wallet.publicKey,
        receiptMint: receiptMintKeypair.publicKey,
        receiptMintMetadata: receiptMintMetadataId,
        recipientTokenAccount: recipientTokenAccountId,
        receiptMintManager: receiptManagerId,
        payer: wallet.publicKey,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        associatedToken: token_1.ASSOCIATED_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenMetadataProgram: common_1.METADATA_PROGRAM_ID,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
    transaction.add(claimReceiptMintIx);
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
const withClaimToken = async (
  transaction,
  connection,
  wallet,
  tokenManagerId,
  additionalOptions,
  buySideTokenAccountId
) => {
  var _a;
  const claimApproverId = (0, pda_1.findClaimApproverAddress)(tokenManagerId);
  const accountData = await (0, common_1.fetchAccountDataById)(connection, [
    tokenManagerId,
    claimApproverId,
  ]);
  const tokenManagerInfo = accountData[tokenManagerId.toString()];
  if (
    !(tokenManagerInfo === null || tokenManagerInfo === void 0
      ? void 0
      : tokenManagerInfo.data)
  )
    throw "Token manager not found";
  const tokenManagerData = (0, common_1.decodeIdlAccount)(
    tokenManagerInfo,
    "tokenManager",
    tokenManager_1.TOKEN_MANAGER_IDL
  );
  const claimApproverInfo = accountData[claimApproverId.toString()];
  const claimApproverData = claimApproverInfo
    ? (0, common_1.tryDecodeIdlAccount)(
        claimApproverInfo,
        "paidClaimApprover",
        claimApprover_1.CLAIM_APPROVER_IDL
      )
    : null;
  const metadataId = (0, common_1.findMintMetadataId)(
    tokenManagerData.parsed.mint
  );
  const metadata = await (0, common_1.tryNull)(
    mpl_token_metadata_1.Metadata.fromAccountAddress(connection, metadataId)
  );
  const claimReceiptId = programs_1.tokenManager.pda.findClaimReceiptId(
    tokenManagerId,
    wallet.publicKey
  );
  if (
    tokenManagerData.parsed.kind ===
      tokenManager_1.TokenManagerKind.Programmable ||
    (metadata === null || metadata === void 0
      ? void 0
      : metadata.tokenStandard) ===
      mpl_token_metadata_1.TokenStandard.ProgrammableNonFungible
  ) {
    transaction.add(
      web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
        units: 1000000,
      })
    );
  }
  // pay claim approver
  if (
    (claimApproverData === null || claimApproverData === void 0
      ? void 0
      : claimApproverData.parsed) &&
    tokenManagerData.parsed.claimApprover &&
    tokenManagerData.parsed.claimApprover.toString() ===
      claimApproverId.toString()
  ) {
    const payerTokenAccountId = (0, spl_token_1.getAssociatedTokenAddressSync)(
      claimApproverData.parsed.paymentMint,
      wallet.publicKey
    );
    const [
      issuerTokenAccountId,
      feeCollectorTokenAccountId,
      remainingAccounts,
    ] = await (0, utils_3.withRemainingAccountsForPayment)(
      transaction,
      connection,
      wallet,
      tokenManagerData.parsed.mint,
      claimApproverData.parsed.paymentMint,
      tokenManagerData.parsed.issuer,
      claimApproverData.parsed.paymentManager,
      buySideTokenAccountId,
      {
        receiptMint: tokenManagerData.parsed.receiptMint,
        payer:
          additionalOptions === null || additionalOptions === void 0
            ? void 0
            : additionalOptions.payer,
      }
    );
    const payIx = await (0, claimApprover_1.claimApproverProgram)(
      connection,
      wallet
    )
      .methods.pay()
      .accounts({
        tokenManager: tokenManagerId,
        paymentTokenAccount: issuerTokenAccountId,
        feeCollectorTokenAccount: feeCollectorTokenAccountId,
        paymentManager: claimApproverData.parsed.paymentManager,
        claimApprover: claimApproverId,
        payer: wallet.publicKey,
        payerTokenAccount: payerTokenAccountId,
        claimReceipt: claimReceiptId,
        cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
        cardinalPaymentManager: paymentManager_1.PAYMENT_MANAGER_ADDRESS,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
    transaction.add(payIx);
  } else if (tokenManagerData.parsed.claimApprover) {
    const createClaimReceiptIx = await (0, tokenManager_1.tokenManagerProgram)(
      connection,
      wallet
    )
      .methods.createClaimReceipt(wallet.publicKey)
      .accountsStrict({
        tokenManager: tokenManagerId,
        claimApprover: tokenManagerData.parsed.claimApprover,
        claimReceipt: claimReceiptId,
        payer:
          (additionalOptions === null || additionalOptions === void 0
            ? void 0
            : additionalOptions.payer) || wallet.publicKey,
        systemProgram: web3_js_1.SystemProgram.programId,
      })
      .instruction();
    transaction.add(createClaimReceiptIx);
  }
  const tokenManagerTokenAccountId = (0,
  spl_token_1.getAssociatedTokenAddressSync)(
    tokenManagerData.parsed.mint,
    tokenManagerId,
    true
  );
  const recipientTokenAccountId = (0,
  spl_token_1.getAssociatedTokenAddressSync)(
    tokenManagerData.parsed.mint,
    wallet.publicKey
  );
  transaction.add(
    (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(
      (_a =
        additionalOptions === null || additionalOptions === void 0
          ? void 0
          : additionalOptions.payer) !== null && _a !== void 0
        ? _a
        : wallet.publicKey,
      recipientTokenAccountId,
      wallet.publicKey,
      tokenManagerData.parsed.mint
    )
  );
  // claim
  const claimIx = await (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  )
    .methods.claim()
    .accounts({
      tokenManager: tokenManagerId,
      tokenManagerTokenAccount: tokenManagerTokenAccountId,
      mint: tokenManagerData.parsed.mint,
      recipient: wallet.publicKey,
      recipientTokenAccount: recipientTokenAccountId,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
      systemProgram: web3_js_1.SystemProgram.programId,
    })
    .remainingAccounts(
      (0, utils_2.getRemainingAccountsForClaim)(
        { parsed: tokenManagerData.parsed, pubkey: tokenManagerId },
        recipientTokenAccountId,
        metadata,
        claimReceiptId
      )
    )
    .instruction();
  transaction.add(claimIx);
  return transaction;
};
exports.withClaimToken = withClaimToken;
const withUnissueToken = async (transaction, connection, wallet, mintId) => {
  const tokenManagerId = (0, pda_3.tokenManagerAddressFromMint)(mintId);
  const [tokenManagerInfo, metadataInfo] = await (0,
  common_1.getBatchedMultipleAccounts)(connection, [
    tokenManagerId,
    (0, common_1.findMintMetadataId)(mintId),
  ]);
  const metadata = metadataInfo
    ? mpl_token_metadata_1.Metadata.deserialize(metadataInfo.data)[0]
    : null;
  if (!tokenManagerInfo) throw "Token manager not found";
  const tokenManager = (0, common_1.decodeIdlAccount)(
    tokenManagerInfo,
    "tokenManager",
    tokenManager_1.TOKEN_MANAGER_IDL
  );
  transaction.add(
    (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(
      wallet.publicKey,
      (0, spl_token_1.getAssociatedTokenAddressSync)(mintId, wallet.publicKey),
      wallet.publicKey,
      mintId
    )
  );
  transaction.add(
    await (0, tokenManager_1.tokenManagerProgram)(connection, wallet)
      .methods.unissue()
      .accounts({
        tokenManager: tokenManagerId,
        tokenManagerTokenAccount: (0,
        spl_token_1.getAssociatedTokenAddressSync)(
          mintId,
          tokenManagerId,
          true
        ),
        issuer: wallet.publicKey,
        issuerTokenAccount: (0, spl_token_1.getAssociatedTokenAddressSync)(
          mintId,
          wallet.publicKey
        ),
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(
        (0, utils_2.getRemainingAccountsForUnissue)(
          tokenManagerId,
          tokenManager.parsed,
          metadata
        )
      )
      .instruction()
  );
  return transaction;
};
exports.withUnissueToken = withUnissueToken;
const withInvalidate = async (
  transaction,
  connection,
  wallet,
  mintId,
  UTCNow = Date.now() / 1000
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const tmeInvalidatorProgram = (0, timeInvalidator_1.timeInvalidatorProgram)(
    connection,
    wallet
  );
  const usgInvalidatorProgram = (0, useInvalidator_1.useInvalidatorProgram)(
    connection,
    wallet
  );
  const tokenManagerId = (0, pda_3.tokenManagerAddressFromMint)(mintId);
  const useInvalidatorId =
    programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId);
  const timeInvalidatorId =
    programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
  const [useInvalidatorData, timeInvalidatorData, tokenManagerData, metadata] =
    await Promise.all([
      (0, common_1.tryGetAccount)(() =>
        programs_1.useInvalidator.accounts.getUseInvalidator(
          connection,
          useInvalidatorId
        )
      ),
      (0, common_1.tryGetAccount)(() =>
        programs_1.timeInvalidator.accounts.getTimeInvalidator(
          connection,
          timeInvalidatorId
        )
      ),
      (0, common_1.tryGetAccount)(() =>
        programs_1.tokenManager.accounts.getTokenManager(
          connection,
          tokenManagerId
        )
      ),
      (0, common_1.tryNull)(
        mpl_token_metadata_1.Metadata.fromAccountAddress(
          connection,
          (0, common_1.findMintMetadataId)(mintId)
        )
      ),
    ]);
  if (!tokenManagerData) return transaction;
  if (
    tokenManagerData.parsed.kind ===
      tokenManager_1.TokenManagerKind.Programmable ||
    (metadata === null || metadata === void 0
      ? void 0
      : metadata.tokenStandard) ===
      mpl_token_metadata_1.TokenStandard.ProgrammableNonFungible
  ) {
    transaction.add(
      web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
        units: 1000000,
      })
    );
  }
  const recipientTokenAccount = await (0, spl_token_1.getAccount)(
    connection,
    tokenManagerData.parsed.recipientTokenAccount
  );
  const tokenManagerTokenAccountId = await (0,
  common_1.withFindOrInitAssociatedTokenAccount)(
    transaction,
    connection,
    mintId,
    tokenManagerId,
    wallet.publicKey,
    true
  );
  const remainingAccounts = await (0,
  utils_2.withRemainingAccountsForInvalidate)(
    transaction,
    connection,
    wallet,
    mintId,
    tokenManagerData,
    recipientTokenAccount.owner,
    metadata
  );
  if (
    useInvalidatorData &&
    useInvalidatorData.parsed.totalUsages &&
    useInvalidatorData.parsed.usages.gte(useInvalidatorData.parsed.totalUsages)
  ) {
    const invalidateIx = await usgInvalidatorProgram.methods
      .invalidate()
      .accounts({
        tokenManager: tokenManagerId,
        useInvalidator: useInvalidatorId,
        invalidator: wallet.publicKey,
        cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        tokenManagerTokenAccount: tokenManagerTokenAccountId,
        mint: mintId,
        recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
    transaction.add(invalidateIx);
    const closeIx = await usgInvalidatorProgram.methods
      .close()
      .accounts({
        tokenManager: tokenManagerId,
        useInvalidator: useInvalidatorId,
        collector: useInvalidatorData.parsed.collector,
        closer: wallet.publicKey,
      })
      .instruction();
    transaction.add(closeIx);
  } else if (
    timeInvalidatorData &&
    (0, utils_1.shouldTimeInvalidate)(
      tokenManagerData,
      timeInvalidatorData,
      UTCNow
    )
  ) {
    const invalidateIx = await tmeInvalidatorProgram.methods
      .invalidate()
      .accounts({
        tokenManager: tokenManagerId,
        timeInvalidator: timeInvalidatorId,
        invalidator: wallet.publicKey,
        cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        tokenManagerTokenAccount: tokenManagerTokenAccountId,
        mint: mintId,
        recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
    transaction.add(invalidateIx);
    const closeIx = await tmeInvalidatorProgram.methods
      .close()
      .accounts({
        tokenManager: tokenManagerId,
        timeInvalidator: timeInvalidatorId,
        collector: timeInvalidatorData.parsed.collector,
        closer: wallet.publicKey,
      })
      .instruction();
    transaction.add(closeIx);
  } else if (
    tokenManagerData.parsed.invalidators.some((inv) =>
      inv.equals(wallet.publicKey)
    ) ||
    tokenManagerData.parsed.invalidationType ===
      tokenManager_1.InvalidationType.Return ||
    tokenManagerData.parsed.invalidationType ===
      tokenManager_1.InvalidationType.Reissue
  ) {
    const invalidateIx = await tmManagerProgram.methods
      .invalidate()
      .accounts({
        tokenManager: tokenManagerId,
        tokenManagerTokenAccount: tokenManagerTokenAccountId,
        mint: mintId,
        recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount,
        invalidator: wallet.publicKey,
        collector: tokenManager_1.CRANK_KEY,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
    transaction.add(invalidateIx);
  }
  return transaction;
};
exports.withInvalidate = withInvalidate;
const withReturn = async (
  transaction,
  connection,
  wallet,
  tokenManagerData
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const tokenManagerTokenAccountId = await (0,
  common_1.withFindOrInitAssociatedTokenAccount)(
    transaction,
    connection,
    tokenManagerData.parsed.mint,
    tokenManagerData.pubkey,
    wallet.publicKey,
    true
  );
  const remainingAccountsForReturn = await (0,
  utils_2.withRemainingAccountsForReturn)(
    transaction,
    connection,
    wallet,
    tokenManagerData
  );
  const transferAccounts = (0, utils_2.getRemainingAccountsForKind)(
    tokenManagerData.parsed.mint,
    tokenManagerData.parsed.kind
  );
  const invalidateIx = await tmManagerProgram.methods
    .invalidate()
    .accounts({
      tokenManager: tokenManagerData.pubkey,
      tokenManagerTokenAccount: tokenManagerTokenAccountId,
      mint: tokenManagerData.parsed.mint,
      recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount,
      invalidator: wallet.publicKey,
      collector: tokenManager_1.CRANK_KEY,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
      rent: web3_js_1.SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts([
      ...(tokenManagerData.parsed.state ===
      tokenManager_1.TokenManagerState.Claimed
        ? transferAccounts
        : []),
      ...remainingAccountsForReturn,
    ])
    .instruction();
  transaction.add(invalidateIx);
  return transaction;
};
exports.withReturn = withReturn;
const withUse = async (
  transaction,
  connection,
  wallet,
  mintId,
  usages,
  collector
) => {
  const tokenManagerId = (0, pda_3.tokenManagerAddressFromMint)(mintId);
  const usgInvalidatorProgram = (0, useInvalidator_1.useInvalidatorProgram)(
    connection,
    wallet
  );
  const useInvalidatorId =
    programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId);
  const [useInvalidatorData, tokenManagerData] = await Promise.all([
    (0, common_1.tryGetAccount)(() =>
      programs_1.useInvalidator.accounts.getUseInvalidator(
        connection,
        useInvalidatorId
      )
    ),
    (0, common_1.tryGetAccount)(() =>
      programs_1.tokenManager.accounts.getTokenManager(
        connection,
        tokenManagerId
      )
    ),
  ]);
  if (!useInvalidatorData) {
    // init
    const initIx = await usgInvalidatorProgram.methods
      .init({
        collector:
          collector !== null && collector !== void 0
            ? collector
            : tokenManager_1.CRANK_KEY,
        paymentManager: claimApprover_1.defaultPaymentManagerId,
        totalUsages: null,
        maxUsages: null,
        useAuthority: null,
        extensionPaymentAmount: null,
        extensionPaymentMint: null,
        extensionUsages: null,
      })
      .accounts({
        tokenManager: tokenManagerId,
        useInvalidator: useInvalidatorId,
        issuer: wallet.publicKey,
        payer: wallet.publicKey,
        systemProgram: web3_js_1.SystemProgram.programId,
      })
      .instruction();
    transaction.add(initIx);
  }
  if (
    !(tokenManagerData === null || tokenManagerData === void 0
      ? void 0
      : tokenManagerData.parsed.recipientTokenAccount)
  )
    throw new Error("Token manager has not been claimed");
  // use
  const incrementUsagesIx = await usgInvalidatorProgram.methods
    .incrementUsages(new anchor_1.BN(usages))
    .accounts({
      tokenManager: tokenManagerId,
      useInvalidator: useInvalidatorId,
      recipientTokenAccount:
        tokenManagerData === null || tokenManagerData === void 0
          ? void 0
          : tokenManagerData.parsed.recipientTokenAccount,
      user: wallet.publicKey,
    })
    .instruction();
  transaction.add(incrementUsagesIx);
  if (
    (useInvalidatorData === null || useInvalidatorData === void 0
      ? void 0
      : useInvalidatorData.parsed.totalUsages) &&
    (useInvalidatorData === null || useInvalidatorData === void 0
      ? void 0
      : useInvalidatorData.parsed.usages
          .add(new anchor_1.BN(usages))
          .gte(
            useInvalidatorData === null || useInvalidatorData === void 0
              ? void 0
              : useInvalidatorData.parsed.totalUsages
          ))
  ) {
    const tokenManagerTokenAccountId = await (0,
    common_1.withFindOrInitAssociatedTokenAccount)(
      transaction,
      connection,
      mintId,
      tokenManagerId,
      wallet.publicKey,
      true
    );
    const remainingAccountsForReturn = await (0,
    utils_2.withRemainingAccountsForReturn)(
      transaction,
      connection,
      wallet,
      tokenManagerData
    );
    const remainingAccountsForKind = (0, utils_2.getRemainingAccountsForKind)(
      mintId,
      tokenManagerData.parsed.kind
    );
    const invalidateIx = await usgInvalidatorProgram.methods
      .invalidate()
      .accounts({
        tokenManager: tokenManagerId,
        useInvalidator: useInvalidatorId,
        invalidator: wallet.publicKey,
        cardinalTokenManager: tokenManager_1.TOKEN_MANAGER_ADDRESS,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        tokenManagerTokenAccount: tokenManagerTokenAccountId,
        mint: mintId,
        recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
      })
      .remainingAccounts([
        ...remainingAccountsForKind,
        ...remainingAccountsForReturn,
      ])
      .instruction();
    transaction.add(invalidateIx);
    const closeIx = await usgInvalidatorProgram.methods
      .close()
      .accounts({
        tokenManager: tokenManagerId,
        useInvalidator: useInvalidatorId,
        collector: useInvalidatorData.parsed.collector,
        closer: wallet.publicKey,
      })
      .instruction();
    transaction.add(closeIx);
  }
  return transaction;
};
exports.withUse = withUse;
const withExtendExpiration = async (
  transaction,
  connection,
  wallet,
  tokenManagerId,
  secondsToAdd,
  options,
  buySideTokenAccountId
) => {
  const tmeInvalidatorProgram = (0, timeInvalidator_1.timeInvalidatorProgram)(
    connection,
    wallet
  );
  const timeInvalidatorId =
    programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
  const [timeInvalidatorData, tokenManagerData] = await Promise.all([
    programs_1.timeInvalidator.accounts.getTimeInvalidator(
      connection,
      timeInvalidatorId
    ),
    programs_1.tokenManager.accounts.getTokenManager(
      connection,
      tokenManagerId
    ),
  ]);
  if (timeInvalidatorData && timeInvalidatorData.parsed.extensionPaymentMint) {
    const payerTokenAccountId = await (0, common_1.findAta)(
      timeInvalidatorData.parsed.extensionPaymentMint,
      wallet.publicKey
    );
    const [
      paymentTokenAccountId,
      feeCollectorTokenAccountId,
      remainingAccounts,
    ] = await (0, utils_3.withRemainingAccountsForPayment)(
      transaction,
      connection,
      wallet,
      tokenManagerData.parsed.mint,
      timeInvalidatorData.parsed.extensionPaymentMint,
      tokenManagerData.parsed.issuer,
      timeInvalidatorData.parsed.paymentManager,
      buySideTokenAccountId,
      {
        receiptMint: tokenManagerData.parsed.receiptMint,
        payer: options === null || options === void 0 ? void 0 : options.payer,
      }
    );
    const extendExpirationIx = await tmeInvalidatorProgram.methods
      .extendExpiration(new anchor_1.BN(secondsToAdd))
      .accounts({
        tokenManager: tokenManagerId,
        timeInvalidator: timeInvalidatorId,
        paymentManager: timeInvalidatorData.parsed.paymentManager,
        paymentTokenAccount: paymentTokenAccountId,
        feeCollectorTokenAccount: feeCollectorTokenAccountId,
        payer: wallet.publicKey,
        payerTokenAccount: payerTokenAccountId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        cardinalPaymentManager: paymentManager_1.PAYMENT_MANAGER_ADDRESS,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
    transaction.add(extendExpirationIx);
  } else {
    console.log("No payment mint");
  }
  return transaction;
};
exports.withExtendExpiration = withExtendExpiration;
const withExtendUsages = async (
  transaction,
  connection,
  wallet,
  tokenManagerId,
  usagesToAdd,
  options,
  buySideTokenAccountId
) => {
  const usgInvalidatorProgram = (0, useInvalidator_1.useInvalidatorProgram)(
    connection,
    wallet
  );
  const useInvalidatorId =
    programs_1.useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId);
  const [useInvalidatorData, tokenManagerData] = await Promise.all([
    programs_1.useInvalidator.accounts.getUseInvalidator(
      connection,
      useInvalidatorId
    ),
    programs_1.tokenManager.accounts.getTokenManager(
      connection,
      tokenManagerId
    ),
  ]);
  if (useInvalidatorData && useInvalidatorData.parsed.extensionPaymentMint) {
    const payerTokenAccountId = await (0,
    common_1.withFindOrInitAssociatedTokenAccount)(
      transaction,
      connection,
      useInvalidatorData.parsed.extensionPaymentMint,
      wallet.publicKey,
      wallet.publicKey
    );
    const [
      paymentTokenAccountId,
      feeCollectorTokenAccountId,
      remainingAccounts,
    ] = await (0, utils_3.withRemainingAccountsForPayment)(
      transaction,
      connection,
      wallet,
      tokenManagerData.parsed.mint,
      useInvalidatorData.parsed.extensionPaymentMint,
      tokenManagerData.parsed.issuer,
      useInvalidatorData.parsed.paymentManager,
      buySideTokenAccountId,
      {
        receiptMint: tokenManagerData.parsed.receiptMint,
        payer: options === null || options === void 0 ? void 0 : options.payer,
      }
    );
    const extendUsagesIx = await usgInvalidatorProgram.methods
      .extendUsages(new anchor_1.BN(usagesToAdd))
      .accounts({
        tokenManager: tokenManagerId,
        useInvalidator: useInvalidatorId,
        paymentManager: useInvalidatorData.parsed.paymentManager,
        paymentTokenAccount: paymentTokenAccountId,
        feeCollectorTokenAccount: feeCollectorTokenAccountId,
        payer: wallet.publicKey,
        payerTokenAccount: payerTokenAccountId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        cardinalPaymentManager: paymentManager_1.PAYMENT_MANAGER_ADDRESS,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();
    transaction.add(extendUsagesIx);
  }
  return transaction;
};
exports.withExtendUsages = withExtendUsages;
const withResetExpiration = async (
  transaction,
  connection,
  wallet,
  tokenManagerId
) => {
  const tmeInvalidatorProgram = (0, timeInvalidator_1.timeInvalidatorProgram)(
    connection,
    wallet
  );
  const timeInvalidatorId =
    programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
  const [tokenManagerData] = await Promise.all([
    programs_1.tokenManager.accounts.getTokenManager(
      connection,
      tokenManagerId
    ),
  ]);
  if (
    tokenManagerData.parsed.state === tokenManager_1.TokenManagerState.Issued
  ) {
    const resetExpirationIx = await tmeInvalidatorProgram.methods
      .resetExpiration()
      .accounts({
        tokenManager: tokenManagerId,
        timeInvalidator: timeInvalidatorId,
      })
      .instruction();
    transaction.add(resetExpirationIx);
  } else {
    console.log("Token Manager not in state issued to reset expiration");
  }
  return transaction;
};
exports.withResetExpiration = withResetExpiration;
const withUpdateMaxExpiration = async (
  transaction,
  connection,
  wallet,
  tokenManagerId,
  newMaxExpiration
) => {
  const tmeInvalidatorProgram = (0, timeInvalidator_1.timeInvalidatorProgram)(
    connection,
    wallet
  );
  const timeInvalidatorId =
    programs_1.timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId);
  const [tokenManagerData] = await Promise.all([
    programs_1.tokenManager.accounts.getTokenManager(
      connection,
      tokenManagerId
    ),
  ]);
  if (
    tokenManagerData.parsed.state !==
    tokenManager_1.TokenManagerState.Invalidated
  ) {
    const updateExpirationIx = await tmeInvalidatorProgram.methods
      .updateMaxExpiration({
        newMaxExpiration: newMaxExpiration,
      })
      .accounts({
        tokenManager: tokenManagerId,
        timeInvalidator: timeInvalidatorId,
        issuer: wallet.publicKey,
      })
      .instruction();
    transaction.add(updateExpirationIx);
  } else {
    console.log("Token Manager not in state issued to update max expiration");
  }
  return transaction;
};
exports.withUpdateMaxExpiration = withUpdateMaxExpiration;
const withTransfer = async (
  transaction,
  connection,
  wallet,
  mintId,
  recipient = wallet.publicKey
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const tokenManagerId = (0, pda_3.findTokenManagerAddress)(mintId);
  const tokenManagerData = await (0, common_1.tryGetAccount)(() =>
    (0, accounts_1.getTokenManager)(connection, tokenManagerId)
  );
  if (
    !(tokenManagerData === null || tokenManagerData === void 0
      ? void 0
      : tokenManagerData.parsed)
  ) {
    throw "No token manager found";
  }
  const recipientTokenAccountId = await (0,
  common_1.withFindOrInitAssociatedTokenAccount)(
    transaction,
    connection,
    mintId,
    recipient,
    wallet.publicKey,
    true
  );
  const remainingAccountsForKind = (0, utils_2.getRemainingAccountsForKind)(
    mintId,
    tokenManagerData.parsed.kind
  );
  const remainingAccountsForTransfer = (0,
  utils_2.getRemainingAccountsForTransfer)(
    tokenManagerData.parsed.transferAuthority,
    tokenManagerId
  );
  const transferIx = await tmManagerProgram.methods
    .transfer()
    .accounts({
      tokenManager: tokenManagerId,
      mint: mintId,
      currentHolderTokenAccount: tokenManagerData.parsed.recipientTokenAccount,
      recipient: recipient,
      recipientTokenAccount: recipientTokenAccountId,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
    .remainingAccounts([
      ...remainingAccountsForKind,
      ...remainingAccountsForTransfer,
    ])
    .instruction();
  transaction.add(transferIx);
  return transaction;
};
exports.withTransfer = withTransfer;
const withDelegate = async (
  transaction,
  connection,
  wallet,
  mintId,
  recipient = wallet.publicKey
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const tokenManagerId = (0, pda_3.findTokenManagerAddress)(mintId);
  const tokenManagerData = await (0, common_1.tryGetAccount)(() =>
    (0, accounts_1.getTokenManager)(connection, tokenManagerId)
  );
  if (
    !(tokenManagerData === null || tokenManagerData === void 0
      ? void 0
      : tokenManagerData.parsed)
  ) {
    throw "No token manager found";
  }
  const mintManagerId = (0, pda_3.findMintManagerId)(mintId);
  const delegateIx = await tmManagerProgram.methods
    .delegate()
    .accounts({
      tokenManager: tokenManagerId,
      mint: mintId,
      mintManager: mintManagerId,
      recipient: recipient,
      recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
    .instruction();
  transaction.add(delegateIx);
  return transaction;
};
exports.withDelegate = withDelegate;
const withUndelegate = async (
  transaction,
  connection,
  wallet,
  mintId,
  recipient
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const tokenManagerId = (0, pda_3.findTokenManagerAddress)(mintId);
  const tokenManagerData = await (0, common_1.tryGetAccount)(() =>
    (0, accounts_1.getTokenManager)(connection, tokenManagerId)
  );
  if (
    !(tokenManagerData === null || tokenManagerData === void 0
      ? void 0
      : tokenManagerData.parsed)
  ) {
    throw "No token manager found";
  }
  const mintManagerId = (0, pda_3.findMintManagerId)(mintId);
  const recipientTokenAccountId = await (0, common_1.findAta)(
    mintId,
    recipient !== null && recipient !== void 0 ? recipient : wallet.publicKey,
    true
  );
  const undelegateIx = await tmManagerProgram.methods
    .undelegate()
    .accounts({
      tokenManager: tokenManagerId,
      mint: mintId,
      mintManager: mintManagerId,
      recipient: recipient,
      recipientTokenAccount: recipientTokenAccountId,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
    .instruction();
  transaction.add(undelegateIx);
  return transaction;
};
exports.withUndelegate = withUndelegate;
const withSend = async (
  transaction,
  connection,
  wallet,
  mintId,
  senderTokenAccountId,
  target
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const tokenManagerId = (0, pda_3.findTokenManagerAddress)(mintId);
  const tokenManagerData = await (0, common_1.tryGetAccount)(() =>
    (0, accounts_1.getTokenManager)(connection, tokenManagerId)
  );
  if (
    !(tokenManagerData === null || tokenManagerData === void 0
      ? void 0
      : tokenManagerData.parsed)
  ) {
    throw "No token manager found";
  }
  const mintManagerId = (0, pda_3.findMintManagerId)(mintId);
  const listingId = (0, pda_4.findListingAddress)(mintId);
  const checkListing = await (0, common_1.tryGetAccount)(() =>
    (0, accounts_2.getListing)(connection, listingId)
  );
  if (checkListing) {
    throw "Token is already listed. You need to delist the token first before sending it.";
  }
  const targetTokenAccountId = await (0, common_1.findAta)(
    mintId,
    target,
    true
  );
  const sendIx = await tmManagerProgram.methods
    .send()
    .accounts({
      tokenManager: tokenManagerId,
      mint: mintId,
      mintManager: mintManagerId,
      recipient: wallet.publicKey,
      recipientTokenAccount: senderTokenAccountId,
      target: target,
      targetTokenAccount: targetTokenAccountId,
      payer: wallet.publicKey,
      associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
      systemProgram: web3_js_1.SystemProgram.programId,
      rent: web3_js_1.SYSVAR_RENT_PUBKEY,
      instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();
  transaction.add(sendIx);
  return transaction;
};
exports.withSend = withSend;
const withMigrate = async (
  transaction,
  connection,
  wallet,
  mintId,
  rulesetName,
  holderTokenAccountId,
  authority
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const currentMintManagerId = (0, pda_3.findMintManagerId)(mintId);
  const mintManagerId = (0, creator_standard_1.findMintManagerId)(mintId);
  const tokenManagerId = (0, pda_3.findTokenManagerAddress)(mintId);
  const rulesetId = (0, creator_standard_1.findRulesetId)(rulesetName);
  const mintMetadataId = (0, common_1.findMintMetadataId)(mintId);
  const migrateIx = await tmManagerProgram.methods
    .migrate()
    .accountsStrict({
      currentMintManager: currentMintManagerId,
      mintManager: mintManagerId,
      mint: mintId,
      mintMetadata: mintMetadataId,
      ruleset: rulesetId,
      tokenManager: tokenManagerId,
      holderTokenAccount: holderTokenAccountId,
      tokenAuthority: currentMintManagerId,
      authority: authority,
      payer: wallet.publicKey,
      rent: web3_js_1.SYSVAR_RENT_PUBKEY,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
      systemProgram: web3_js_1.SystemProgram.programId,
      cardinalCreatorStandard: creator_standard_1.PROGRAM_ADDRESS,
    })
    .instruction();
  transaction.add(migrateIx);
  return transaction;
};
exports.withMigrate = withMigrate;
const withReplaceInvalidator = async (
  transaction,
  connection,
  wallet,
  tokenManagerId,
  newInvalidator
) => {
  const tmManagerProgram = (0, tokenManager_1.tokenManagerProgram)(
    connection,
    wallet
  );
  const replaceInvalidatorIx = await tmManagerProgram.methods
    .replaceInvalidator(newInvalidator)
    .accounts({
      tokenManager: tokenManagerId,
      invalidator: wallet.publicKey,
    })
    .instruction();
  transaction.add(replaceInvalidatorIx);
  return transaction;
};
exports.withReplaceInvalidator = withReplaceInvalidator;
//# sourceMappingURL=transaction.js.map
