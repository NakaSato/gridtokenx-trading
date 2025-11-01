"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";

interface SendSolProps {
  onSuccess?: (signature: string) => void;
}

/**
 * Example component showing how to send SOL to another account
 */
export const SendSolExample: FC<SendSolProps> = ({ onSuccess }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendSol = async () => {
    if (!connection || !publicKey) {
      toast.error("Wallet not connected or connection unavailable");
      return;
    }

    if (!recipient || !amount) {
      toast.error("Please enter recipient address and amount");
      return;
    }

    setLoading(true);
    try {
      const recipientPubKey = new PublicKey(recipient);
      const lamports = Math.floor(Number(amount) * LAMPORTS_PER_SOL);

      const transaction = new Transaction();
      const sendSolInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubKey,
        lamports,
      });

      transaction.add(sendSolInstruction);

      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction Signature:", signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      toast.success(`Transaction confirmed! Signature: ${signature}`);
      onSuccess?.(signature);

      // Reset form
      setRecipient("");
      setAmount("");
    } catch (error: any) {
      console.error("Transaction failed:", error);
      toast.error(`Failed to send SOL: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return <div className="text-sm text-muted-foreground">Please connect your wallet first</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Send SOL</h3>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Recipient Address</label>
        <Input
          placeholder="Enter recipient Solana address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Amount (SOL)</label>
        <Input
          type="number"
          placeholder="Enter amount in SOL"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          step="0.01"
          min="0"
        />
      </div>

      <Button onClick={handleSendSol} disabled={loading || !recipient || !amount}>
        {loading ? "Sending..." : "Send SOL"}
      </Button>

      {loading && <div className="text-sm text-muted-foreground">Please confirm in your wallet...</div>}
    </div>
  );
};
