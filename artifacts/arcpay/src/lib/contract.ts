import { ethers } from "ethers";

export const POOL_ADDRESS = "0x3561df6cf9a669e16423229f26504033ab229346";

export const POOL_ABI = [
  "constructor(address _token)",
  "function NULLIFIER_DOMAIN() view returns (bytes32)",
  "function commitmentCount(bytes32) view returns (uint256)",
  "function computeCommitment(bytes32 secret, uint256 amount) pure returns (bytes32)",
  "function computeNullifier(bytes32 secret) view returns (bytes32)",
  "function deposit(uint256 amount, uint256 netAmount, bytes32 commitment)",
  "function feeBps() view returns (uint256)",
  "function getDepositFee(uint256 amount) view returns (uint256)",
  "function getNetDepositAmount(uint256 amount) view returns (uint256)",
  "function owner() view returns (address)",
  "function pause()",
  "function paused() view returns (bool)",
  "function setFee(uint256 _feeBps)",
  "function setOwner(address newOwner)",
  "function setTreasury(address _treasury)",
  "function token() view returns (address)",
  "function treasury() view returns (address)",
  "function unpause()",
  "function usedNullifiers(bytes32) view returns (bool)",
  "function withdraw(uint256 amount, bytes32 secret)",
  "function withdrawTo(address recipient, uint256 amount, bytes32 secret)",
  "event Deposited(address indexed token, uint256 amount, bytes32 indexed commitment)",
  "event Withdrawn(address indexed token, address indexed recipient, uint256 amount, bytes32 indexed nullifier)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ─── Off-chain commitment/nullifier helpers (must match PrivacyPool contract) ──

/**
 * NULLIFIER_DOMAIN = keccak256("PrivacyPool.v1.nullifier")
 * Must match the constant in the Solidity contract.
 */
export const NULLIFIER_DOMAIN: string = ethers.keccak256(
  ethers.toUtf8Bytes("PrivacyPool.v1.nullifier")
);

/**
 * Generate a 32-byte secret using the browser's CSPRNG.
 * Never uses block data, timestamp, or any on-chain value.
 */
export function generateSecret(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return "0x" + Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * commitment = keccak256(abi.encodePacked(secret, netAmount))
 * secret   → bytes32
 * netAmount → uint256
 */
export function computeCommitmentOffChain(secret: string, netAmount: bigint): string {
  return ethers.keccak256(
    ethers.solidityPacked(["bytes32", "uint256"], [secret, netAmount])
  );
}

/**
 * nullifier = keccak256(abi.encodePacked(NULLIFIER_DOMAIN, secret))
 * Both typed as bytes32.
 */
export function computeNullifierOffChain(secret: string): string {
  return ethers.keccak256(
    ethers.solidityPacked(["bytes32", "bytes32"], [NULLIFIER_DOMAIN, secret])
  );
}

// ─── Note format ─────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  /** 0x-prefixed 32-byte hex secret. Never share until withdraw. */
  secret: string;
  /** Gross deposit amount (wei string) — what the user approved. */
  grossAmount: string;
  /** Net amount (wei string) = getNetDepositAmount(grossAmount). Used in withdraw(). */
  netAmount: string;
  /** Human-readable net amount string (e.g. "99.0"). */
  amountFormatted: string;
  /** Off-chain computed commitment = keccak256(pack(secret, netAmount)). */
  commitment: string;
  timestamp: number;
  txHash: string;
  spent: boolean;
}

const NOTES_KEY = "arcpay_notes";

export function saveNote(note: Note) {
  const notes = loadNotes();
  notes.unshift(note);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function markNoteSpent(id: string) {
  const notes = loadNotes();
  const updated = notes.map((n) => (n.id === id ? { ...n, spent: true } : n));
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
}

export function formatTokenAmount(raw: bigint, decimals: number): string {
  return ethers.formatUnits(raw, decimals);
}

export function parseTokenAmount(value: string, decimals: number): bigint {
  try {
    return ethers.parseUnits(value, decimals);
  } catch {
    return 0n;
  }
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
