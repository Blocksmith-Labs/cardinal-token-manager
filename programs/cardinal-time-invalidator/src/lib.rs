pub mod errors;
pub mod instructions;
pub mod state;

use {anchor_lang::prelude::*, instructions::*};

declare_id!("5Jd9DPJ7Q99dNBRso8Xm1ZE215GRjbtkdPEz8U5QWZfU");

#[program]
pub mod cardinal_time_invalidator {
    use super::*;

    pub fn init(ctx: Context<InitCtx>, ix: InitIx) -> Result<()> {
        init::handler(ctx, ix)
    }

    pub fn extend_expiration<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, ExtendExpirationCtx<'info>>, seconds_to_add: u64) -> Result<()> {
        extend_expiration::handler(ctx, seconds_to_add)
    }

    pub fn reset_expiration(ctx: Context<ResetExpirationCtx>) -> Result<()> {
        reset_expiration::handler(ctx)
    }

    pub fn update_max_expiration(ctx: Context<UpdateMaxExpirationCtx>, ix: UpdateMaxExpirationIx) -> Result<()> {
        update_max_expiration::handler(ctx, ix)
    }

    pub fn invalidate<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, InvalidateCtx<'info>>) -> Result<()> {
        invalidate::handler(ctx)
    }

    pub fn close(ctx: Context<CloseCtx>) -> Result<()> {
        close::handler(ctx)
    }
}
