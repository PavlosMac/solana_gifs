use anchor_lang::prelude::*;

declare_id!("6nS7aKfbY3WShCbxYc25NDU74A7S1MMkA99eyfaejJCX");

#[program]
pub mod myepicproject {

    use super::*;

    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn upvote_gif(ctx: Context<Vote>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let item = base_account
            .gif_list
            .iter_mut()
            .find(|i| i.gif_link == gif_link);
        match item {
            Some(item) => {
                item.votes += 1;
            }
            None => return Err(ProgramError::InvalidArgument.into()),
        }
        Ok(())
    }

    pub fn delete_gif(ctx: Context<Vote>, _gif_link: String) -> ProgramResult {
        let caller = ctx.accounts.user.to_account_info().key();
        let base_account = &mut ctx.accounts.base_account;
        base_account
            .gif_list
            .retain(|x| *x.gif_link != _gif_link && x.user_address == caller);
        Ok(())
    }

    pub fn down_vote_gif(ctx: Context<Vote>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let item = base_account
            .gif_list
            .iter_mut()
            .find(|i| i.gif_link == gif_link);

        match item {
            Some(item) => {
                if item.votes != 0 {
                    item.votes -= 1
                }
            }
            None => return Err(ProgramError::InvalidArgument.into()),
        }
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        // Get a reference to the account and increment total_gifs.

        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
            votes: 0,
        };

        base_account.gif_list.push(item);

        base_account.total_gifs += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub votes: u8,
}

#[error]
pub enum MyError {
    #[msg("This is an error message clients will automatically display")]
    Hello,
}
