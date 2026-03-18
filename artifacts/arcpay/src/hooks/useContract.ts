import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  POOL_ADDRESS, POOL_ABI, ERC20_ABI,
  Note, saveNote, loadNotes, markNoteSpent,
  formatTokenAmount, parseTokenAmount,
} from "@/lib/contract";
import { ARC_CHAIN_PARAMS } from "@/lib/network";

// Read-only provider always pointed at Arc Testnet — works even if MetaMask is on wrong chain
const readProvider = new ethers.JsonRpcProvider(ARC_CHAIN_PARAMS.rpcUrls[0]);

export interface ContractState {
  tokenAddress: string | null;
  tokenSymbol: string;
  tokenDecimals: number;
  feeBps: bigint;
  paused: boolean;
  walletBalance: string;
  loadingBalance: boolean;
  loadError: string | null;
}

export type TxStatus = "idle" | "approving" | "depositing" | "withdrawing" | "success" | "error";

export function useContract(signer: ethers.JsonRpcSigner | null, address: string | null) {
  const [contractState, setContractState] = useState<ContractState>({
    tokenAddress: null,
    tokenSymbol: "—",
    tokenDecimals: 6,
    feeBps: 0n,
    paused: false,
    walletBalance: "—",
    loadingBalance: true,
    loadError: null,
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

  const loadContractInfo = useCallback(async (walletAddr: string | null) => {
    setContractState((s) => ({ ...s, loadingBalance: true, loadError: null }));
    try {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, readProvider);

      const [tokenAddr, feeBps, paused] = await Promise.all([
        pool.token(),
        pool.feeBps(),
        pool.paused(),
      ]);

      let symbol = "TOKEN";
      let decimals = 6;
      let walletBalance = "—";

      const token = new ethers.Contract(tokenAddr as string, ERC20_ABI, readProvider);

      const [symResult, decResult] = await Promise.allSettled([
        token.symbol(),
        token.decimals(),
      ]);

      if (symResult.status === "fulfilled") {
        symbol = symResult.value as string;
      } else {
        // Some tokens (old USDC) return bytes32 for symbol — try decoding
        try {
          const raw = await readProvider.call({ to: tokenAddr as string, data: "0x95d89b41" });
          symbol = ethers.decodeBytes32String(raw);
        } catch {
          symbol = "TOKEN";
        }
      }

      if (decResult.status === "fulfilled") {
        decimals = Number(decResult.value);
      }

      if (walletAddr) {
        const balResult = await Promise.allSettled([token.balanceOf(walletAddr)]);
        if (balResult[0].status === "fulfilled") {
          walletBalance = formatTokenAmount(balResult[0].value as bigint, decimals);
        } else {
          walletBalance = "0";
        }
      }

      setContractState({
        tokenAddress: tokenAddr as string,
        tokenSymbol: symbol,
        tokenDecimals: decimals,
        feeBps: feeBps as bigint,
        paused: paused as boolean,
        walletBalance,
        loadingBalance: false,
        loadError: null,
      });
    } catch (err: unknown) {
      const msg = (err as { shortMessage?: string; message?: string })?.shortMessage
        || (err as { message?: string })?.message
        || "Failed to load";
      console.error("loadContractInfo error:", err);
      setContractState((s) => ({ ...s, loadingBalance: false, loadError: msg.slice(0, 80) }));
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setContractState((s) => ({ ...s, loadingBalance: true, loadError: null }));
    try {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, readProvider);
      const tokenAddr: string = contractState.tokenAddress
        || (await pool.token() as string);
      const token = new ethers.Contract(tokenAddr, ERC20_ABI, readProvider);

      const [paused, bal] = await Promise.allSettled([
        pool.paused(),
        token.balanceOf(address),
      ]);

      setContractState((s) => ({
        ...s,
        tokenAddress: tokenAddr,
        loadingBalance: false,
        loadError: null,
        paused: paused.status === "fulfilled" ? (paused.value as boolean) : s.paused,
        walletBalance: bal.status === "fulfilled"
          ? formatTokenAmount(bal.value as bigint, s.tokenDecimals)
          : s.walletBalance,
      }));
    } catch (err: unknown) {
      const msg = (err as { shortMessage?: string; message?: string })?.shortMessage
        || (err as { message?: string })?.message || "Refresh failed";
      console.error("refreshBalance error:", err);
      setContractState((s) => ({ ...s, loadingBalance: false, loadError: msg.slice(0, 80) }));
    }
  }, [address, contractState.tokenAddress, contractState.tokenDecimals]);

  // Load contract info on mount (no wallet needed for read-only)
  useEffect(() => {
    loadContractInfo(address);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const deposit = useCallback(async (amountStr: string) => {
    if (!signer || !address) return;
    setTxStatus("approving");
    setTxError(null);
    setTxHash(null);

    // Re-read token address if not set
    let tokenAddr = contractState.tokenAddress;
    let tokenDecimals = contractState.tokenDecimals;
    if (!tokenAddr) {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, readProvider);
      tokenAddr = await pool.token() as string;
    }

    try {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, signer);
      const token = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
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
        amountFormatted: formatTokenAmount(netAmount as bigint, tokenDecimals),
        commitment,
        timestamp: Date.now(),
        txHash: receipt.hash,
        spent: false,
      };
      saveNote(note);
      refreshNotes();
      setTxStatus("success");
      setTimeout(() => refreshBalance(), 2000);
    } catch (err: unknown) {
      setTxError(parseContractError(err));
      setTxStatus("error");
    }
  }, [signer, address, contractState, refreshNotes, refreshBalance]);

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
      let useAmount = amountStr;

      if (isNoteId) {
        const note = notes.find((n) => n.id === secretOrNoteId);
        if (!note) throw new Error("Note not found");
        secret = note.secret;
        noteId = note.id;
        useAmount = formatTokenAmount(BigInt(note.amount), tokenDecimals);
      }

      const amountWei = parseTokenAmount(useAmount, tokenDecimals);
      if (amountWei === 0n) throw new Error("Invalid amount");

      const signerAddress = await signer.getAddress();
      let tx;
      if (recipient && recipient.toLowerCase() !== signerAddress.toLowerCase()) {
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
      setTimeout(() => refreshBalance(), 2000);
    } catch (err: unknown) {
      setTxError(parseContractError(err));
      setTxStatus("error");
    }
  }, [signer, contractState, notes, refreshNotes, refreshBalance]);

  const resetTx = useCallback(() => {
    setTxStatus("idle");
    setTxHash(null);
    setTxError(null);
  }, []);

  return {
    contractState,
    notes,
    txStatus, txHash, txError,
    deposit, withdraw, resetTx,
    refreshNotes, refreshBalance,
  };
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
    return e.message.slice(0, 120);
  }
  return "Transaction failed";
}
