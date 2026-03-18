import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  POOL_ADDRESS, POOL_ABI, ERC20_ABI,
  Note, saveNote, loadNotes, markNoteSpent,
  formatTokenAmount, parseTokenAmount,
} from "@/lib/contract";

export interface ContractState {
  tokenAddress: string | null;
  tokenSymbol: string;
  tokenDecimals: number;
  feeBps: bigint;
  paused: boolean;
  loading: boolean;
}

export type TxStatus = "idle" | "approving" | "depositing" | "withdrawing" | "success" | "error";

export function useContract(signer: ethers.JsonRpcSigner | null, address: string | null) {
  const [contractState, setContractState] = useState<ContractState>({
    tokenAddress: null,
    tokenSymbol: "USDC",
    tokenDecimals: 6,
    feeBps: 0n,
    paused: false,
    loading: false,
  });
  const [notes, setNotes] = useState<Note[]>([]);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const refreshNotes = useCallback(() => {
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  useEffect(() => {
    if (!signer) return;
    let cancelled = false;
    (async () => {
      try {
        const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, signer);
        const [tokenAddr, feeBps, paused] = await Promise.all([
          pool.token(),
          pool.feeBps(),
          pool.paused(),
        ]);
        const token = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
        const [symbol, decimals] = await Promise.all([
          token.symbol(),
          token.decimals(),
        ]);
        if (!cancelled) {
          setContractState({ tokenAddress: tokenAddr, tokenSymbol: symbol, tokenDecimals: Number(decimals), feeBps, paused, loading: false });
        }
      } catch (err) {
        console.error("Failed to load contract state:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [signer]);

  const deposit = useCallback(async (amountStr: string) => {
    if (!signer || !address) return;
    const { tokenAddress, tokenDecimals } = contractState;
    if (!tokenAddress) return;
    setTxStatus("approving");
    setTxError(null);
    setTxHash(null);
    try {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, signer);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const amountWei = parseTokenAmount(amountStr, tokenDecimals);
      if (amountWei === 0n) throw new Error("Invalid amount");

      const secret = ethers.hexlify(ethers.randomBytes(32));
      const [commitment, netAmount] = await Promise.all([
        pool.computeCommitment(secret, amountWei),
        pool.getNetDepositAmount(amountWei),
      ]);

      const allowance: bigint = await token.allowance(address, POOL_ADDRESS);
      if (allowance < amountWei) {
        const approveTx = await token.approve(POOL_ADDRESS, amountWei);
        await approveTx.wait();
      }

      setTxStatus("depositing");
      const tx = await pool.deposit(amountWei, netAmount, commitment);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      const note: Note = {
        id: `${receipt.hash}-${Date.now()}`,
        secret,
        amount: amountWei.toString(),
        amountFormatted: formatTokenAmount(netAmount, tokenDecimals),
        commitment,
        timestamp: Date.now(),
        txHash: receipt.hash,
        spent: false,
      };
      saveNote(note);
      refreshNotes();
      setTxStatus("success");
    } catch (err: unknown) {
      const msg = parseContractError(err);
      setTxError(msg);
      setTxStatus("error");
    }
  }, [signer, address, contractState, refreshNotes]);

  const withdraw = useCallback(async (
    secretOrNoteId: string,
    amountStr: string,
    recipient: string,
    isNoteId = false
  ) => {
    if (!signer) return;
    const { tokenDecimals, tokenAddress } = contractState;
    if (!tokenAddress) return;
    setTxStatus("withdrawing");
    setTxError(null);
    setTxHash(null);
    try {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, signer);

      let secret = secretOrNoteId;
      let noteId: string | null = null;

      if (isNoteId) {
        const note = notes.find((n) => n.id === secretOrNoteId);
        if (!note) throw new Error("Note not found");
        secret = note.secret;
        noteId = note.id;
        amountStr = formatTokenAmount(BigInt(note.amount), tokenDecimals);
      }

      const amountWei = parseTokenAmount(amountStr, tokenDecimals);
      if (amountWei === 0n) throw new Error("Invalid amount");

      let tx;
      if (recipient && recipient.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
        tx = await pool.withdrawTo(recipient, amountWei, secret);
      } else {
        tx = await pool.withdraw(amountWei, secret);
      }

      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      if (noteId) {
        markNoteSpent(noteId);
        refreshNotes();
      }
      setTxStatus("success");
    } catch (err: unknown) {
      const msg = parseContractError(err);
      setTxError(msg);
      setTxStatus("error");
    }
  }, [signer, contractState, notes, refreshNotes]);

  const resetTx = useCallback(() => {
    setTxStatus("idle");
    setTxHash(null);
    setTxError(null);
  }, []);

  return { contractState, notes, txStatus, txHash, txError, deposit, withdraw, resetTx, refreshNotes };
}

function parseContractError(err: unknown): string {
  if (!err) return "Unknown error";
  const e = err as { reason?: string; message?: string; shortMessage?: string };
  if (e.shortMessage) return e.shortMessage;
  if (e.reason) return e.reason;
  if (e.message) {
    if (e.message.includes("CommitmentNotFound")) return "Commitment not found in pool";
    if (e.message.includes("NullifierAlreadyUsed")) return "This note has already been withdrawn";
    if (e.message.includes("ContractPaused")) return "Contract is currently paused";
    if (e.message.includes("InvalidAmount")) return "Invalid amount";
    if (e.message.includes("user rejected")) return "Transaction rejected";
    if (e.message.includes("insufficient funds")) return "Insufficient funds for gas";
    return e.message.slice(0, 100);
  }
  return "Transaction failed";
}
