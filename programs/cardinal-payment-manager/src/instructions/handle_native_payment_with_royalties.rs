use mpl_token_metadata::utils::assert_derivation;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::Mint,
    mpl_token_metadata::state::Metadata,
    solana_program::{program::invoke, system_instruction::transfer},
};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct HandleNativePaymentWithRoyaltiesCtx<'info> {
    #[account(mut)]
    payment_manager: Box<Account<'info, PaymentManager>>,

    #[account(mut, constraint = fee_collector.key() == payment_manager.fee_collector @ ErrorCode::InvalidFeeCollector)]
    /// CHECK: This is not dangerous because of the check above
    fee_collector: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because this is just the pubkey that collects the payment
    #[account(mut)]
    payment_target: UncheckedAccount<'info>,
    #[account(mut)]
    payer: Signer<'info>,

    mint: Box<Account<'info, Mint>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    mint_metadata: AccountInfo<'info>,

    system_program: Program<'info, System>,
    // > Remaining accounts for each mint creator
    // creator
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, HandleNativePaymentWithRoyaltiesCtx<'info>>, payment_amount: u64) -> Result<()> {
    let payment_manager = &mut ctx.accounts.payment_manager;
    // maker-taker fees
    let maker_fee = payment_amount
        .checked_mul(payment_manager.maker_fee_basis_points.into())
        .expect("Multiplication error")
        .checked_div(BASIS_POINTS_DIVISOR.into())
        .expect("Division error");
    let taker_fee = payment_amount
        .checked_mul(payment_manager.taker_fee_basis_points.into())
        .expect("Multiplication error")
        .checked_div(BASIS_POINTS_DIVISOR.into())
        .expect("Division error");
    let mut total_fees = maker_fee.checked_add(taker_fee).expect("Add error");

    // assert metadata account derivation
    assert_derivation(
        &mpl_token_metadata::id(),
        &ctx.accounts.mint_metadata.to_account_info(),
        &[mpl_token_metadata::state::PREFIX.as_bytes(), mpl_token_metadata::id().as_ref(), ctx.accounts.mint.key().as_ref()],
    )?;

    // royalties
    let mut fees_paid_out: u64 = 0;
    let remaining_accs = &mut ctx.remaining_accounts.iter();
    if !ctx.accounts.mint_metadata.data_is_empty() {
        if ctx.accounts.mint_metadata.to_account_info().owner.key() != mpl_token_metadata::id() {
            return Err(error!(ErrorCode::InvalidMintMetadataOwner));
        }
        let mint_metadata_data = ctx.accounts.mint_metadata.try_borrow_mut_data().expect("Failed to borrow data");
        let mint_metadata = Metadata::deserialize(&mut mint_metadata_data.as_ref()).expect("Failed to deserialize metadata");
        if mint_metadata.mint != ctx.accounts.mint.key() {
            return Err(error!(ErrorCode::InvalidMintMetadata));
        }
        let seller_fee = if payment_manager.include_seller_fee_basis_points {
            payment_amount
                .checked_mul(mint_metadata.data.seller_fee_basis_points.into())
                .expect("Multiplication error")
                .checked_div(BASIS_POINTS_DIVISOR.into())
                .expect("Division error")
        } else {
            0
        };
        let total_creators_fee = total_fees
            .checked_mul(payment_manager.royalty_fee_share.unwrap_or(DEFAULT_ROYALTY_FEE_SHARE))
            .unwrap()
            .checked_div(BASIS_POINTS_DIVISOR.into())
            .expect("Div error")
            .checked_add(seller_fee)
            .expect("Add error");
        total_fees = total_fees.checked_add(seller_fee).expect("Add error");

        if let Some(creators) = mint_metadata.data.creators {
            let creator_amounts: Vec<u64> = creators
                .clone()
                .into_iter()
                .map(|creator| total_creators_fee.checked_mul(u64::try_from(creator.share).expect("Could not cast u8 to u64")).unwrap())
                .collect();
            let creator_amounts_sum: u64 = creator_amounts.iter().sum();
            let mut creators_fee_remainder = total_creators_fee.checked_sub(creator_amounts_sum.checked_div(100).expect("Div error")).expect("Sub error");
            for creator in creators {
                if creator.share != 0 {
                    let creator_info = next_account_info(remaining_accs)?;
                    if creator_info.key() != creator.address {
                        return Err(error!(ErrorCode::InvalidCreatorAddress));
                    }
                    let share = u64::try_from(creator.share).expect("Could not cast u8 to u64");
                    let creator_fee_remainder_amount = u64::from(creators_fee_remainder > 0);
                    let creator_fee_amount = total_creators_fee
                        .checked_mul(share)
                        .unwrap()
                        .checked_div(100)
                        .expect("Div error")
                        .checked_add(creator_fee_remainder_amount)
                        .expect("Add error");
                    creators_fee_remainder = creators_fee_remainder.checked_sub(creator_fee_remainder_amount).expect("Sub error");

                    if creator_fee_amount > 0 {
                        fees_paid_out = fees_paid_out.checked_add(creator_fee_amount).expect("Add error");
                        invoke(
                            &transfer(&ctx.accounts.payer.key(), &creator_info.key(), creator_fee_amount),
                            &[ctx.accounts.payer.to_account_info(), creator_info.to_account_info(), ctx.accounts.system_program.to_account_info()],
                        )?;
                    }
                }
            }
        }
    }

    // calculate fees
    let buy_side_fee = payment_amount
        .checked_mul(DEFAULT_BUY_SIDE_FEE_SHARE)
        .unwrap()
        .checked_div(BASIS_POINTS_DIVISOR.into())
        .expect("Div error");
    let mut fee_collector_fee = total_fees.checked_add(buy_side_fee).expect("Add error").checked_sub(fees_paid_out).expect("Sub error");

    // pay buy side fee
    let buy_side_info = next_account_info(remaining_accs);
    if buy_side_info.is_ok() {
        let buy_side = buy_side_info?;
        invoke(
            &transfer(&ctx.accounts.payer.key(), &buy_side.key(), buy_side_fee),
            &[ctx.accounts.payer.to_account_info(), buy_side.to_account_info(), ctx.accounts.system_program.to_account_info()],
        )?;
        // remove buy side fee out of fee collector fee
        fee_collector_fee = fee_collector_fee.checked_sub(buy_side_fee).expect("Sub error");
    }

    if fee_collector_fee > 0 {
        // pay remaining fees to fee_colector
        invoke(
            &transfer(&ctx.accounts.payer.key(), &ctx.accounts.fee_collector.key(), fee_collector_fee),
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.fee_collector.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    // pay target
    invoke(
        &transfer(
            &ctx.accounts.payer.key(),
            &ctx.accounts.payment_target.key(),
            payment_amount
                .checked_add(taker_fee)
                .expect("Add error")
                .checked_sub(total_fees)
                .expect("Sub error")
                .checked_sub(buy_side_fee)
                .expect("Sub error"),
        ),
        &[
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.payment_target.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    Ok(())
}
