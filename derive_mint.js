
const { PublicKey } = require('@solana/web3.js');

const PROGRAM_ID = new PublicKey("8jTDw36yCQyYdr9hTtve5D5bFuQdaJ6f3WbdM4iGPHuq");
const SEED = Buffer.from("mint_2022");

const [mint] = PublicKey.findProgramAddressSync([SEED], PROGRAM_ID);
console.log("Energy Token Mint:", mint.toString());
