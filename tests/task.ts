import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Farming } from "../target/types/farming";
import {
  closeAccountInstructionData,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";
import {
  Account,
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import fs from "fs";
import { Keypair } from "@solana/web3.js";

import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// import { TokenHelper } from "./token_helper";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { BN } from "bn.js";
import { assert, expect } from "chai";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
const connection = new anchor.web3.Connection(
  anchor.web3.clusterApiUrl("devnet")
);

anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.Farming as Program<Farming>;

//const connection = anchor.getProvider().connection;
console.log("Connection", connection);
const finoMintAddress = new anchor.web3.PublicKey(
  "54qAckkqAqr2qCVup8SYgxkUyPvx1q8yuyaHPvXY7tAc"
);
const rinoMintAddress = new anchor.web3.PublicKey(
  "9AudsJe3WCUWCQvNcwh4X2PDy4pYsLv4CUp3e2bdVM11"
);
const mint = "Esgomh6g2xn9dF9K82NBKLTwhRx2eeSeSh4K9JYKZbCH";

describe("Farming", () => {
  // Configure the client to use the local cluster.
  const user2 = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      147, 240, 151, 8, 246, 159, 63, 214, 65, 222, 46, 116, 91, 29, 207, 0,
      254, 238, 127, 47, 185, 230, 148, 73, 133, 157, 14, 135, 137, 41, 208, 93,
      7, 7, 234, 242, 103, 72, 163, 37, 207, 205, 214, 241, 42, 46, 162, 251,
      123, 118, 182, 139, 214, 40, 252, 232, 175, 85, 143, 86, 134, 113, 23,
      203,
    ])
  );
  const user3 = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      244, 153, 34, 68, 79, 216, 57, 210, 144, 143, 81, 103, 213, 209, 232, 107,
      22, 240, 174, 245, 244, 154, 22, 56, 118, 255, 254, 138, 238, 45, 6, 191,
      72, 223, 10, 57, 55, 182, 21, 199, 170, 220, 6, 167, 103, 82, 189, 121,
      195, 88, 82, 38, 218, 214, 192, 100, 94, 214, 235, 189, 131, 235, 131, 26,
    ])
  );
  const user4 = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      249, 56, 212, 93, 206, 162, 150, 111, 26, 57, 189, 80, 30, 193, 97, 195,
      116, 80, 24, 125, 141, 204, 0, 179, 200, 211, 52, 31, 216, 8, 37, 85, 133,
      244, 233, 99, 25, 91, 110, 24, 166, 5, 215, 172, 57, 47, 42, 80, 194, 249,
      245, 235, 202, 98, 63, 16, 59, 245, 112, 191, 199, 29, 170, 201,
    ])
  );
  const user5 = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      34, 190, 48, 111, 97, 113, 83, 136, 188, 13, 70, 81, 53, 181, 218, 57,
      168, 214, 4, 120, 233, 81, 7, 231, 159, 7, 35, 60, 15, 172, 36, 33, 109,
      172, 88, 169, 223, 83, 74, 187, 20, 220, 71, 102, 178, 161, 60, 199, 251,
      203, 28, 9, 206, 104, 107, 252, 45, 211, 127, 132, 0, 123, 151, 232,
    ])
  );
  //anchor.setProvider(provider);

  const programID = new anchor.web3.PublicKey(
    "5d9tLof4jXidE1eMaSu4go4QUKn53uJUuSNACnUUYgUp"
  );
  // it("Create Mints ", async () => {
  //   const user=user5;
  //   console.log("user5",user.publicKey);
  //   const rewardData = JSON.parse(
  //     fs.readFileSync("reward_token.json", { encoding: "utf8", flag: "r" })
  //   );
  //   const rewardMintKeypair = Keypair.fromSecretKey(new Uint8Array(rewardData));
  //   const rewardMintAddress = rewardMintKeypair.publicKey;
  //   const [rewardPDA, rewardPDABump] = await PublicKey.findProgramAddress(
  //     [rewardMintAddress.toBuffer()],
  //     program.programId
  //   );

  //   const rewardMint = await createMintAcct(
  //     rewardMintKeypair,
  //     rewardPDA,user)

  // console.log(`Reward's  Mint Address: ${rewardMint}`);
  // });
  // it("intialize Staking user Account ", async () => {
  //   const crypto = require("crypto");
  //   const user = user5;

  //   console.log("User5 ppublick key is ", user5.publicKey.toBase58());
  //   let hexString = crypto
  //     .createHash("sha256")
  //     .update(mint, "utf-8")
  //     .digest("hex");
  //   console.log("hex String ", hexString);
  //   let seed = Uint8Array.from(Buffer.from(hexString, "hex"));

  //   const [stakeAccountPDA] = await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       utf8.encode("FarmingProfile"),
  //       new anchor.web3.PublicKey(mint).toBuffer(),
  //       user.publicKey.toBuffer(),
  //     ],
  //     programID
  //   );
  //   console.log("The stake Account pda is ", stakeAccountPDA);
  //   await program.methods.intializeUserAccount(new anchor.web3.PublicKey(mint)).accounts({
  //     user: user.publicKey,
  //     userStakingAccount: stakeAccountPDA,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     systemProgram: anchor.web3.SystemProgram.programId,
  //   }) .signers([user]).rpc();

  //   const stakeAccount = await program.account.lpStakingProfile.fetch(
  //     stakeAccountPDA
  //   );
  //   console.log(stakeAccount);
  // });
  // it("Stake !", async () => {
  //   // Add your test here.

  //   const user = user5;
  //   console.log("user is", user.publicKey.toBase58());

  //   // console.log("program id is ", programID);

  //   const [stakeAccountPDA] = await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       utf8.encode("FarmingProfile"),
  //       new anchor.web3.PublicKey(mint).toBuffer(),
  //       user.publicKey.toBuffer(),
  //     ],
  //     programID
  //   );
  //   const fetchedStakingAccount = await program.account.lpStakingProfile.fetch(
  //     stakeAccountPDA
  //   );
  //   let stakedAccounts = fetchedStakingAccount.stakedAccounts;
  //   stakedAccounts += 1;
  //   const stake_count = stakedAccounts.toString();
  //   console.log("Stake count is ", stake_count.toString());
  //   const [stakePDA] = await anchor.web3.PublicKey.findProgramAddress(
  //     [utf8.encode("stakeLp"),stakeAccountPDA.toBuffer(),utf8.encode(stake_count)],
  //     programID
  //   );
  //   console.log("stakePDA", stakePDA.toBase58());
  //   const userLpAccount = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     user,
  //     new anchor.web3.PublicKey(mint),
  //     user.publicKey,
  //     false
  //   );
  //   const [lpBagPDA, finoBagBump] = await PublicKey.findProgramAddress(
  //     [new anchor.web3.PublicKey(mint).toBuffer()],
  //     program.programId
  //   );
  //   await program.methods
  //     .stakeLp(finoBagBump, stake_count,mint, stakeAccountPDA, new anchor.BN(5))
  //     .accounts({
  //       user: user.publicKey,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       pool: stakePDA,
  //       userProfile: stakeAccountPDA,
  //       userLpTokenBag: userLpAccount.address,
  //       userLpTokenBagAuthority: user.publicKey,
  //       programLpTokenBag: lpBagPDA,
  //       lpMint: new anchor.web3.PublicKey(mint),
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     })
  //     .signers([user])
  //     .rpc();

  //   const stakeAccount = await program.account.pool.fetch(stakePDA);
  //   console.log(stakeAccount.startTime.toString());
  //   console.log(stakeAccount);
  // });

  
  
  it("It creates the program LP💰 token bag", async () => {
    const [lpBagPDA, finoBagBump] = await PublicKey.findProgramAddress(
      [
        new anchor.web3.PublicKey(
          "FCpnc1hE7u6cUvWpiaigoKHChUtnFFjt85ny1eVDmfiH"
        ).toBuffer(),
      ],
      program.programId
    );

    console.log("program pda is ", lpBagPDA);
    const user = user5;
    await program.methods
      .createLpTokenBag("FCpnc1hE7u6cUvWpiaigoKHChUtnFFjt85ny1eVDmfiH")
      .accounts({
        lpMint: new anchor.web3.PublicKey(
          "FCpnc1hE7u6cUvWpiaigoKHChUtnFFjt85ny1eVDmfiH"
        ),
        programLpTokenBag: lpBagPDA,
        payer: user.publicKey,
        // Solana is lost: where are my spl program friends?
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();
    console.log("fino Program Account ", lpBagPDA);
  });

  //  it("It Withdraw Fino Token ", async () => {
  //     const amount=5;
  //     const user = user5;
  //     const stake_count = "5";
  //     const userLpAccount = await getOrCreateAssociatedTokenAccount(
  //       connection,
  //       user,
  //       new anchor.web3.PublicKey(mint),
  //       user.publicKey,
  //       false
  //     );
    
  //     const [stakeAccountPDA] = await anchor.web3.PublicKey.findProgramAddress(
  //       [
  //         utf8.encode("FarmingProfile"),
  //         new anchor.web3.PublicKey(mint).toBuffer(),
  //         user.publicKey.toBuffer(),
  //       ],
  //       programID
  //     );

  //     const [stakePDA] = await anchor.web3.PublicKey.findProgramAddress(
  //       [
  //         utf8.encode("stakeLp"),
  //         stakeAccountPDA.toBuffer(),
  //         utf8.encode(stake_count),
  //       ],
  //       programID
  //     );

  //     const [rinoPDA, rinoPDABump] = await PublicKey.findProgramAddress(
  //       [rinoMintAddress.toBuffer()],
  //       program.programId
  //     );
  //     const [lpBagPDA, lpBagBump] = await PublicKey.findProgramAddress(
  //       [new anchor.web3.PublicKey(mint).toBuffer()],
  //       program.programId
  //     );
  //     console.log("Pda is ",rinoPDA.toBase58());
  //     // //  2. Execute  stuff
  //     await program.methods
  //       .withdraw(lpBagBump, rinoPDABump, mint, new anchor.BN(amount))
  //       .accounts({
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         pool: stakePDA,
  //         lpMint: new anchor.web3.PublicKey(mint),
  //         userAccount: stakeAccountPDA,
  //         // TRANSFER Fino TO USERS
  //         programLpTokenBag: lpBagPDA,
  //         userLpTokenBag: userLpAccount.address,
  //       })
  //       .rpc();
  //   });

  // it("It Harvest ", async () => {

  //   const user = user5;
  //   console.log("The user is ",user5.publicKey.toBase58());
  //   const stake_count = "6"

  //   const userRinoAccount = await getOrCreateAssociatedTokenAccount(
  //     connection,
  //     user,
  //     rinoMintAddress,
  //     user.publicKey,
  //     false
  //   );
  //   const [stakeAccountPDA] = await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       utf8.encode("FarmingProfile"),
  //       new anchor.web3.PublicKey(mint).toBuffer(),
  //       user.publicKey.toBuffer(),
  //     ],
  //     programID
  //   );

  //   const [stakePDA] = await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       utf8.encode("stakeLp"),
  //       stakeAccountPDA.toBuffer(),
  //       utf8.encode(stake_count),
  //     ],
  //     programID
  //   );
  //   const [rinoPDA, rinoPDABump] = await PublicKey.findProgramAddress(
  //     [rinoMintAddress.toBuffer()],
  //     program.programId
  //   );

  //   console.log("Pda is ",rinoPDA.toBase58());
  //   // // 2. Execute our stuff
  //   // await program.methods
  //   //   .harvest(rinoPDABump)
  //   //   .accounts({
  //   //     tokenProgram: TOKEN_PROGRAM_ID,
  //   //     pool: stakePDA,
  //   //     rinoMint: rinoMintAddress,
  //   //     rinoMintAuthority: rinoPDA,
  //   //     userAccount: stakeAccountPDA,
  //   //     userRinoTokenBag: userRinoAccount.address,
  //   //   })
  //   //   .rpc();

  //       const stakeAccount = await program.account.pool.fetch(stakePDA);
  //   console.log(stakeAccount.startTime.toString());
  //   console.log(stakeAccount);
  //   });
});

const getProgramLpTokenBagPDA = async (seed): Promise<[PublicKey, number]> => {
  seed;

  return await PublicKey.findProgramAddress([seed], program.programId);
};

const createMintAcct = async (
  keypairToAssign: Keypair,
  authorityToAssign: PublicKey,
  payer: Keypair
): Promise<PublicKey> => {
  return await createMint(
    connection,
    payer,
    authorityToAssign, // mint authority
    null, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
    8, // decimals
    keypairToAssign // address of the mint
  );
};
