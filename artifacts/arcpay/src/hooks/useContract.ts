import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  POOL_ADDRESS, POOL_ABI, ERC20_ABI,
  Note, saveNote, loadNotes, markNoteSpent,
  formatTokenAmount, parseTokenAmount,
  generateSecret, computeCommitmentOffChain, computeNullifierOffChain,
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
  nativeBalance: string;
  tokenDeployed: boolean;
  loadingBalance: boolean;
  loadError: string | null;
}

export type TxStatus = "idle" | "approving" | "depositing" | "withdrawing" | "success" | "error";

export function useContract(signer: ethers.JsonRpcSigner | null, address: string | null) {
  const [contractState, setContractState] = useState<ContractState>({
    tokenAddress: null,
    tokenSymbol: "TOKEN",
    tokenDecimals: 6,
    feeBps: 0n,
    paused: false,
    walletBalance: "—",
    nativeBalance: "—",
    tokenDeployed: true,
    loadingBalance: true,
    loadError: null,
  });
  const [notes, setNotes] = useState<Note[]>([]);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const refreshNotes = useCallback(() => {
    if (!address) { setNotes([]); return; }
    const stored = loadNotes(address);
    setNotes(stored);

    // Silently verify unspent notes against on-chain nullifiers
    const unspent = stored.filter((n) => !n.spent);
    if (unspent.length === 0) return;
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, readProvider);
    Promise.allSettled(
      unspent.map(async (note) => {
        try {
          const nullifier = computeNullifierOffChain(note.secret);
          const used = await pool.usedNullifiers(nullifier) as boolean;
          if (used) markNoteSpent(note.id, address);
        } catch { /* ignore rpc errors */ }
      })
    ).then(() => {
      // Re-load notes after on-chain checks complete
      setNotes(loadNotes(address));
    }).catch(() => {});
  }, [address]);

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

      // Check if ERC20 token contract is actually deployed
      const tokenCode = await readProvider.getCode(tokenAddr as string);
      const tokenDeployed = tokenCode !== "0x" && tokenCode.length > 2;

      let symbol = "TOKEN";
      let decimals = 6;
      let walletBalance = "—";
      let nativeBalance = "—";

      if (tokenDeployed) {
        const token = new ethers.Contract(tokenAddr as string, ERC20_ABI, readProvider);
        const [symResult, decResult] = await Promise.allSettled([
          token.symbol(),
          token.decimals(),
        ]);
        if (symResult.status === "fulfilled") {
          symbol = symResult.value as string;
        } else {
          try {
            const raw = await readProvider.call({ to: tokenAddr as string, data: "0x95d89b41" });
            if (raw !== "0x") symbol = ethers.decodeBytes32String(raw.padEnd(66, "0").slice(0, 66));
          } catch { /* keep default */ }
        }
        if (decResult.status === "fulfilled") decimals = Number(decResult.value);

        if (walletAddr) {
          const balResult = await Promise.allSettled([token.balanceOf(walletAddr)]);
          walletBalance = balResult[0].status === "fulfilled"
            ? formatTokenAmount(balResult[0].value as bigint, decimals)
            : "0";
        }
      }

      if (walletAddr) {
        const natBal = await readProvider.getBalance(walletAddr);
        nativeBalance = parseFloat(ethers.formatEther(natBal)).toFixed(4);
      }

      setContractState({
        tokenAddress: tokenAddr as string,
        tokenSymbol: symbol,
        tokenDecimals: decimals,
        feeBps: feeBps as bigint,
        paused: paused as boolean,
        walletBalance,
        nativeBalance,
        tokenDeployed,
        loadingBalance: false,
        loadError: null,
      });
    } catch (err: unknown) {
      const msg = (err as { shortMessage?: string; message?: string })?.shortMessage
        || (err as { message?: string })?.message || "Failed to load";
      console.error("loadContractInfo error:", err);
      setContractState((s) => ({ ...s, loadingBalance: false, loadError: msg.slice(0, 100) }));
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setContractState((s) => ({ ...s, loadingBalance: true }));
    try {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, readProvider);
      const tokenAddr: string = contractState.tokenAddress
        || (await pool.token() as string);

      const natBal = await readProvider.getBalance(address);
      const nativeBalance = parseFloat(ethers.formatEther(natBal)).toFixed(4);

      let walletBalance = contractState.walletBalance;
      const tokenCode = await readProvider.getCode(tokenAddr);
      const tokenDeployed = tokenCode !== "0x" && tokenCode.length > 2;

      if (tokenDeployed) {
        const token = new ethers.Contract(tokenAddr, ERC20_ABI, readProvider);
        const balResult = await Promise.allSettled([token.balanceOf(address)]);
        if (balResult[0].status === "fulfilled") {
          walletBalance = formatTokenAmount(balResult[0].value as bigint, contractState.tokenDecimals);
        }
      }

      const pausedResult = await Promise.allSettled([pool.paused()]);
      setContractState((s) => ({
        ...s,
        tokenAddress: tokenAddr,
        tokenDeployed,
        nativeBalance,
        walletBalance,
        loadingBalance: false,
        paused: pausedResult[0].status === "fulfilled" ? (pausedResult[0].value as boolean) : s.paused,
      }));
    } catch (err: unknown) {
      const msg = (err as { shortMessage?: string; message?: string })?.shortMessage
        || (err as { message?: string })?.message || "Refresh failed";
      console.error("refreshBalance error:", err);
      setContractState((s) => ({ ...s, loadingBalance: false, loadError: msg.slice(0, 100) }));
    }
  }, [address, contractState.tokenAddress, contractState.tokenDecimals, contractState.walletBalance]);

  useEffect(() => {
    loadContractInfo(address);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // ── Deposit ──────────────────────────────────────────────────────────────

  const deposit = useCallback(async (amountStr: string) => {
    if (!signer || !address) return;
    setTxStatus("approving");
    setTxError(null);
    setTxHash(null);

    let tokenAddr = contractState.tokenAddress;
    const tokenDecimals = contractState.tokenDecimals;
    if (!tokenAddr) {
      const p = new ethers.Contract(POOL_ADDRESS, POOL_ABI, readProvider);
      tokenAddr = await p.token() as string;
    }

    try {
      const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, signer);
      const token = new ethers.Contract(tokenAddr, ERC20_ABI, signer);

      const grossAmount = parseTokenAmount(amountStr, tokenDecimals);
      if (grossAmount === 0n) throw new Error("Invalid amount");

      // 1. Get netAmount from contract (amount after fee)
      const netAmount: bigint = await pool.getNetDepositAmount(grossAmount);

      // 2. Generate secret using browser CSPRNG (no chain data)
      const secret = generateSecret();

      // 3. Compute commitment entirely off-chain
      const commitment = computeCommitmentOffChain(secret, netAmount);

      // 4. Optionally verify our commitment matches contract's computation
      //    (cross-check during development — no extra tx cost, it's a pure view)
      const contractCommitment: string = await pool.computeCommitment(secret, netAmount);
      if (commitment.toLowerCase() !== contractCommitment.toLowerCase()) {
        throw new Error("Commitment mismatch — possible contract ABI change. Please reload.");
      }

      // 5. Approve token spend
      const allowance: bigint = await token.allowance(address, POOL_ADDRESS);
      if (allowance < grossAmount) {
        const approveTx = await token.approve(POOL_ADDRESS, grossAmount);
        await approveTx.wait();
      }

      // 6. Deposit: pass (grossAmount, netAmount, commitment)
      setTxStatus("depositing");
      const tx = await pool.deposit(grossAmount, netAmount, commitment);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      // 7. Save note — store netAmount (used in withdraw), grossAmount for display
      const note: Note = {
        id: `${receipt.hash}-${Date.now()}`,
        secret,
        grossAmount: grossAmount.toString(),
        netAmount: netAmount.toString(),
        amountFormatted: formatTokenAmount(netAmount, tokenDecimals),
        commitment,
        timestamp: Date.now(),
        txHash: receipt.hash,
        spent: false,
      };
      saveNote(note, address);
      refreshNotes();
      setTxStatus("success");
      setTimeout(() => refreshBalance(), 2000);
    } catch (err: unknown) {
      setTxError(parseContractError(err));
      setTxStatus("error");
    }
  }, [signer, address, contractState, refreshNotes, refreshBalance]);

  // ── Withdraw ─────────────────────────────────────────────────────────────

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

      let secret: string;
      let netAmountWei: bigint;
      let noteId: string | null = null;

      if (isNoteId) {
        const note = notes.find((n) => n.id === secretOrNoteId);
        if (!note) throw new Error("Note not found");
        secret = note.secret;
        noteId = note.id;
        // Use netAmount from the note (the post-fee amount stored at deposit time)
        netAmountWei = BigInt(note.netAmount);
      } else {
        secret = secretOrNoteId;
        netAmountWei = parseTokenAmount(amountStr, tokenDecimals);
      }

      if (netAmountWei === 0n) throw new Error("Invalid amount");

      // Pre-verify the note before sending transaction (saves gas on likely failures)
      const commitment = computeCommitmentOffChain(secret, netAmountWei);
      const nullifier = computeNullifierOffChain(secret);

      const [countResult, usedResult] = await Promise.allSettled([
        pool.commitmentCount(commitment),
        pool.usedNullifiers(nullifier),
      ]);

      if (countResult.status === "fulfilled" && BigInt(countResult.value as bigint) < 1n) {
        throw new Error("Commitment not found in pool — check your secret and amount");
      }
      if (usedResult.status === "fulfilled" && usedResult.value === true) {
        throw new Error("This note has already been withdrawn");
      }

      const signerAddress = await signer.getAddress();
      let tx;
      if (recipient && recipient.toLowerCase() !== signerAddress.toLowerCase()) {
        tx = await pool.withdrawTo(recipient, netAmountWei, secret);
      } else {
        tx = await pool.withdraw(netAmountWei, secret);
      }

      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      if (noteId && address) {
        markNoteSpent(noteId, address);
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
  const e = err as { reason?: string; message?: string; shortMessage?: string; code?: string };
  if (e.shortMessage) {
    if (e.shortMessage.includes("could not decode")) return "Token contract call failed — the ERC20 token may not be deployed at the address the pool references.";
    return e.shortMessage;
  }
  if (e.reason) return e.reason;
  if (e.code === "BAD_DATA") return "Token contract call failed — the ERC20 token may not be deployed at the address the pool references.";
  if (e.message) {
    if (e.message.includes("BAD_DATA") || e.message.includes("could not decode")) return "Token contract call failed — the ERC20 token may not be deployed at the address the pool references.";
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
