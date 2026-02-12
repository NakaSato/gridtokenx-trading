import * as anchor from "@coral-xyz/anchor";
import { Program, BN, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import fs from 'fs';
import path from 'path';

// Load IDL
const idlPath = path.resolve(__dirname, "../lib/idl/trading.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

const NUM_USERS = 5;
const NUM_ORDERS = 20;

async function main() {
    process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
    const home = process.env.HOME || process.env.USERPROFILE;
    const walletPath = path.join(home!, ".config/solana/id.json");
    process.env.ANCHOR_WALLET = walletPath;

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = new Program(idl as Idl, provider);
    console.log("🔥 Starting Stress Test on OrderBook...");

    // Market PDA
    const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market")],
        program.programId
    );

    // 1. Setup Users
    console.log(`Creating ${NUM_USERS} users...`);
    const users: Keypair[] = [];
    for (let i = 0; i < NUM_USERS; i++) {
        const user = Keypair.generate();
        users.push(user);
        // Airdrop
        try {
            const sig = await provider.connection.requestAirdrop(user.publicKey, 1 * 1000000000);
            await provider.connection.confirmTransaction(sig);
        } catch (e) {
            console.warn(`Airdrop failed for user ${i}, might have enough SOL or rate limited.`);
        }
    }
    console.log("Users ready.");

    let successCount = 0;
    let failCount = 0;
    const latencies: number[] = [];

    // 2. Loop Orders
    console.log(`🚀 Submitting ${NUM_ORDERS} orders...`);

    for (let i = 0; i < NUM_ORDERS; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const isBuy = Math.random() > 0.5;
        const orderId = new BN(Date.now() + i);
        const startTime = Date.now();

        try {
            if (isBuy) {
                const [orderPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("order"), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
                    program.programId
                );

                await program.methods.createBuyOrder(
                    orderId,
                    new BN(100_000000), // 100 kWh
                    new BN(5_000000)    // 5 USDC/kWh
                ).accounts({
                    market: marketPda,
                    order: orderPda,
                    authority: user.publicKey,
                    systemProgram: SystemProgram.programId,
                } as any).signers([user]).rpc();

            } else {
                const [orderPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("order"), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
                    program.programId
                );

                await program.methods.createSellOrder(
                    orderId,
                    new BN(100_000000),
                    new BN(5_000000)
                ).accounts({
                    market: marketPda,
                    order: orderPda,
                    ercCertificate: null, // Optional
                    authority: user.publicKey,
                    systemProgram: SystemProgram.programId,
                } as any).signers([user]).rpc();
            }

            const latency = Date.now() - startTime;
            latencies.push(latency);
            successCount++;
            process.stdout.write("."); // Progress dot
        } catch (e) {
            failCount++;
            process.stdout.write("x");
            // console.error(e);
        }

        // Small delay to avoid overly aggressive rate limiting on local validator
        await new Promise(r => setTimeout(r, 100));
    }

    console.log("\n\n📊 Stress Test Results:");
    console.log(`Total Orders: ${NUM_ORDERS}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;
    console.log(`⏱️ Avg Confirmation Time: ${avgLatency.toFixed(2)} ms`);

    if (failCount > 0) process.exit(1);
}

main().catch(console.error);
