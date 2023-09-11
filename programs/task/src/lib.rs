use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use num_traits::pow;

use std::mem::size_of;
declare_id!("5d9tLof4jXidE1eMaSu4go4QUKn53uJUuSNACnUUYgUp");

#[program]
pub mod farming {
    pub const RINO_MINT_ADDRESS: &str = "9AudsJe3WCUWCQvNcwh4X2PDy4pYsLv4CUp3e2bdVM11";
    use super::*;
    pub fn intialize_user_account(
        ctx: Context<InitializeUserProfile>,
        lp_mint_address: Pubkey,
    ) -> Result<()> {
        let user_account = &mut ctx.accounts.user_staking_account;
        user_account.staked_accounts = 0;
        user_account.total_staked_amount = 0.0;
        user_account.mint = lp_mint_address;
        Ok(())
    }
    pub fn stake_lp(
        ctx: Context<StakeLp>,
        program_fino_bag_bump: u8,
        stake_count: String,
        lp_mint_address: String,
        user_pda: Pubkey,
        amount: f64,
    ) -> Result<()> {
        let pool: &mut Account<Pool> = &mut ctx.accounts.pool;
        let decimals = ctx.accounts.lp_mint.decimals;
        let stake_profile = &mut ctx.accounts.user_profile;
        pool.amount = 0.0;
        pool.owner = user_pda;
        let amount_decimals: f64 = amount * pow(10.0, decimals as usize);
        // 2. Ask SPL Token Program to transfer Fino from the user.
        let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_lp_token_bag.to_account_info(),
                authority: ctx.accounts.user_lp_token_bag_authority.to_account_info(),
                to: ctx.accounts.program_lp_token_bag.to_account_info(),
            },
        );
        msg!("The amount is {}", decimals as usize);
        msg!("Amount in decimal is {}", amount_decimals);

        token::transfer(cpi_ctx, amount_decimals as u64)?;
        stake_profile.staked_accounts = stake_profile.staked_accounts + 1;
        stake_profile.total_staked_amount = stake_profile.total_staked_amount + amount;
        pool.amount = pool.amount + amount;
        pool.seed = stake_count.parse::<u64>().unwrap();
        pool.mint = lp_mint_address.parse::<Pubkey>().unwrap();
        pool.last_harvest = 0;
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        pool.start_time = current_timestamp;

        Ok(())
    }

    pub fn create_lp_token_bag(
        ctx: Context<CreateLpTokenBag>,
        lp_mint_address: String,
    ) -> Result<()> {
        Ok(())
    }
    pub fn harvest(ctx: Context<Harvest>, rino_mint_authority_bump: u8) -> Result<()> {
        // // Reward rino:
        let decimals = ctx.accounts.rino_mint.decimals;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        let pool = &mut ctx.accounts.pool;
        if pool.amount <= 0.0 {
            return err!(ErrorCode::InsufficentBalance);
        }

        let mut time = 0;
        if pool.last_harvest > 0 {
            time = clock.unix_timestamp - pool.last_harvest;
        } else {
            time = clock.unix_timestamp - pool.start_time;
        }
        pool.last_harvest = current_time;
        let min: f64 = (time as f64) / 60.0;
        if min <= 1.0 {
            return err!(ErrorCode::InsufficentRewardBalance);
        }

        let rino_mint_address = ctx.accounts.rino_mint.key();
        let seeds = &[rino_mint_address.as_ref(), &[rino_mint_authority_bump]];
        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.rino_mint.to_account_info(),
                to: ctx.accounts.user_rino_token_bag.to_account_info(),
                authority: ctx.accounts.rino_mint_authority.to_account_info(),
            },
            &signer,
        );
        msg!("min is {}", min);
        msg!("pool start time  is {}", pool.start_time);
        msg!("current time is   is {}", current_time);
        let amount_decimals = pool.amount * pow(10.0, decimals as usize);
        token::mint_to(cpi_ctx, (amount_decimals * min * 1000.0) as u64)?;

        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        program_lp_bag_bump: u8,
        rino_mint_authority_bump: u8,
        lp_mint_address: String,
        amount: f64,
    ) -> Result<()> {
        let decimals = ctx.accounts.lp_mint.decimals;
        let pool: &mut Account<Pool> = &mut ctx.accounts.pool;
        let stake_profile = &mut ctx.accounts.user_account;
        stake_profile.total_staked_amount = stake_profile.total_staked_amount - pool.amount;
        let clock = Clock::get()?;
        let stakedtime = clock.unix_timestamp - pool.start_time;
        if stakedtime < 120 {
            return err!(ErrorCode::TimeLocked);
        }
        // Ask SPL Token Program to transfer back Fino to the user.
        if pool.amount >= amount {
            // See why we did this in `fn stake()`
            let lp_mint_address = ctx.accounts.lp_mint.key();
            let seeds = &[lp_mint_address.as_ref(), &[program_lp_bag_bump]];
            let signer = [&seeds[..]];

            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.program_lp_token_bag.to_account_info(),
                    authority: ctx.accounts.program_lp_token_bag.to_account_info(),
                    to: ctx.accounts.user_lp_token_bag.to_account_info(),
                },
                &signer,
            );
            msg!("Pool |AMoutnt is {}", pool.amount);
           
            //  let lp_amount: f64 = amount * 100.0; // TODO: Change the formula
            let amount_decimals: f64 = pool.amount * pow(10.0, decimals as usize);
            pool.amount = 0.0;
            token::transfer(cpi_ctx, amount_decimals as u64)?;
        } else {
            return err!(ErrorCode::InsufficentBalance);
        }

        Ok(())
    }
}

// stake Account PDA
// Createstake context
#[derive(Accounts)]
#[instruction(program_lp_bag_bump: u8,stake_count: String,lp_token_address:String,user_pda:Pubkey)]
pub struct StakeLp<'info> {
    //  Account PDA
    #[account(
        init,
        // State account seed uses the string "state" and the users' key. 
        // Note that we can only have 1 active transaction
        seeds = [b"stakeLp".as_ref(),user_pda.as_ref(),stake_count.as_ref()],
        bump,
        payer = user,
        space = size_of::<Pool>() + 16
    )]
    pub pool: Account<'info, Pool>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_profile: Account<'info, LpStakingProfile>,
    // TRANSFERING Fino FROM USERS
    // Associated Token Account for User which holds Fino.
    #[account(mut)]
    pub user_lp_token_bag: Account<'info, TokenAccount>,

    // The authority allowed to mutate the above ⬆️
    pub user_lp_token_bag_authority: Signer<'info>,

    // Used to receive lp from users
    #[account(
        mut,
        seeds = [ lp_mint.key().as_ref() ],
        bump = program_lp_bag_bump,
    )]
    pub program_lp_token_bag: Account<'info, TokenAccount>,

    // Require for the PDA above ⬆️
    #[account(
        address = lp_token_address.parse::<Pubkey>().unwrap(),
    )]
    pub lp_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
#[instruction(lp_mint_address:Pubkey)]
pub struct InitializeUserProfile<'info> {
    //  Account PDA
    #[account(
        init,
        // State account seed uses the string "state" and the users' key. 
        // Note that we can only have 1 active transaction
        seeds = [b"FarmingProfile".as_ref(),lp_mint_address.as_ref(),user.key().as_ref()],
        bump,
        payer = user,
        space = size_of::<LpStakingProfile>() + 16
    )]
    pub user_staking_account: Account<'info, LpStakingProfile>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pool {
    owner: Pubkey,
    amount: f64,
    start_time: i64,
    seed: u64,
    last_harvest: i64,
    mint: Pubkey,
}
#[account]
pub struct LpStakingProfile {
    total_staked_amount: f64,
    staked_accounts: u32,
    mint: Pubkey,
}

#[derive(Accounts)]
#[instruction(lp_mint_address:String)]
pub struct CreateLpTokenBag<'info> {
    // 1. PDA (so pubkey) for the soon-to-be created fino token bag for our program.
    #[account(
        init,
        payer = payer,
        // We use the token mint as a seed for the mapping -> think "HashMap[seeds+bump] = pda"
        seeds = [ lp_mint_address.parse::<Pubkey>().unwrap().as_ref() ],
        bump,
        // Token Program wants to know what kind of token this token bag is for
        token::mint = lp_mint,
        // It's a PDA so the authority is itself!
        token::authority = program_lp_token_bag,
    )]
    pub program_lp_token_bag: Account<'info, TokenAccount>,

    // 2. The mint Fino  because it's needed from above ⬆️ token::mint = ...
    #[account(
        address = lp_mint_address.parse::<Pubkey>().unwrap(),
    )]
    pub lp_mint: Account<'info, Mint>,

    // 3. The rent payer
    #[account(mut)]
    pub payer: Signer<'info>,

    // 4. Needed from Anchor for the creation of an Associated Token Account
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(program_lp_bag_bump: u8,rino_mint_authority_bump:u8,lp_mint_address:String)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_account: Account<'info, LpStakingProfile>,
    // SPL Token Program
    pub token_program: Program<'info, Token>,

    // TRANSFER Lp TO USERS
    // see `token::Transfer.from`
    #[account(
        mut,
        seeds = [lp_mint_address.parse::<Pubkey>().unwrap().as_ref()],
        bump = program_lp_bag_bump,
    )]
    pub program_lp_token_bag: Account<'info, TokenAccount>,

    // see `token::Transfer.to`
    #[account(mut)]
    pub user_lp_token_bag: Account<'info, TokenAccount>,

    // Require for the PDA above ⬆️
    #[account(
        address = lp_mint_address.parse::<Pubkey>().unwrap(),
    )]
    pub lp_mint: Box<Account<'info, Mint>>,
}
#[derive(Accounts)]
#[instruction(rino_mint_authority_bump:u8)]
pub struct Harvest<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    pub token_program: Program<'info, Token>,

    #[account(mut)]
    pub user_account: Account<'info, LpStakingProfile>,

    // minting
    #[account(
        mut,
        address = RINO_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
        )]
    pub rino_mint: Account<'info, Mint>,

    // The authority allowed to mutate the above ⬆️
    // And Print Stake Tokens
    /// CHECK: only used as a signing PDA
    #[account(
        seeds = [ rino_mint.key().as_ref() ],
        bump = rino_mint_authority_bump,
        )]
    pub rino_mint_authority: UncheckedAccount<'info>,

    // Associated Token Account for User to receive Rino
    #[account(mut)]
    pub user_rino_token_bag: Account<'info, TokenAccount>,
}
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficent Fino Balance")]
    InsufficentBalance,
    #[msg("Insufficent Reward Balance")]
    InsufficentRewardBalance,
    #[msg("Time Locked")]
    TimeLocked,
}
