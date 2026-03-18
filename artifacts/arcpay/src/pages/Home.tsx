import { useState, useEffect } from "react";
import {
  Shield, Wallet, ArrowDownToLine, ArrowUpFromLine,
  CheckCircle2, Copy, Eye, EyeOff, ChevronRight,
  Lock, Info, Bell, Settings, Home as HomeIcon,
  Clock, User, Sun, Moon, Key, AlertCircle,
  ExternalLink, XCircle, RefreshCw,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useContract } from "@/hooks/useContract";
import { shortenAddress, formatTokenAmount, POOL_ADDRESS } from "@/lib/contract";
import { ARC_CHAIN_ID, switchToArc } from "@/lib/network";

const dark = {
  PP_BLUE: "#3b9eff",
  PP_BLUE_LIGHT: "rgba(59,158,255,0.12)",
  BG: "#0a0a0f",
  CARD: "#13131c",
  CARD_BORDER: "#1e1e2e",
  INPUT_BG: "#0d0d16",
  INPUT_BORDER: "#252538",
  TEXT: "#f0f0f8",
  TEXT_MUTED: "#6b7280",
  TEXT_DIM: "#38384a",
  SEPARATOR: "#18181f",
  NAV_BG: "#0d0d16",
  HERO_BG: "linear-gradient(180deg, #0d0d16 0%, #10101a 100%)",
  DEPOSIT_ICON: "rgba(74,222,128,0.1)",
  WITHDRAW_ICON: "rgba(251,191,36,0.1)",
  DEPOSIT_COLOR: "#4ade80",
  WITHDRAW_COLOR: "#fbbf24",
  SUCCESS_BG: "rgba(22,163,74,0.12)",
  SUCCESS_BORDER: "rgba(22,163,74,0.3)",
  SUCCESS_COLOR: "#4ade80",
  ERROR_BG: "rgba(239,68,68,0.1)",
  ERROR_BORDER: "rgba(239,68,68,0.3)",
  ERROR_COLOR: "#f87171",
};

const light = {
  PP_BLUE: "#0070ba",
  PP_BLUE_LIGHT: "#e8f4fd",
  BG: "#f5f7fa",
  CARD: "#ffffff",
  CARD_BORDER: "#e5e7eb",
  INPUT_BG: "#fafafa",
  INPUT_BORDER: "#e5e7eb",
  TEXT: "#111827",
  TEXT_MUTED: "#6b7280",
  TEXT_DIM: "#9ca3af",
  SEPARATOR: "#f3f4f6",
  NAV_BG: "#ffffff",
  HERO_BG: "linear-gradient(180deg, #003087 0%, #0070ba 100%)",
  DEPOSIT_ICON: "#f0fdf4",
  WITHDRAW_ICON: "#fef9ec",
  DEPOSIT_COLOR: "#16a34a",
  WITHDRAW_COLOR: "#b45309",
  SUCCESS_BG: "#f0fdf4",
  SUCCESS_BORDER: "#bbf7d0",
  SUCCESS_COLOR: "#16a34a",
  ERROR_BG: "#fef2f2",
  ERROR_BORDER: "#fecaca",
  ERROR_COLOR: "#dc2626",
};

export default function Home() {
  const wallet = useWallet();
  const { contractState, notes, txStatus, txHash, txError, deposit, withdraw, resetTx, refreshBalance } = useContract(
    wallet.signer,
    wallet.address
  );

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [withdrawSecret, setWithdrawSecret] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "notes">("deposit");
  const [activeNav, setActiveNav] = useState("home");
  const [isDark, setIsDark] = useState(true);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const t = isDark ? dark : light;
  const wrongNetwork = wallet.address && wallet.chainId !== null && wallet.chainId !== ARC_CHAIN_ID;

  const handleSwitchNetwork = async () => {
    setSwitchingNetwork(true);
    try { await switchToArc(); } catch { /* user dismissed */ }
    setSwitchingNetwork(false);
  };

  const totalShielded = notes
    .filter((n) => !n.spent)
    .reduce((acc, n) => acc + BigInt(n.amount), 0n);

  const totalShieldedFormatted = totalShielded > 0n
    ? `$${parseFloat(formatTokenAmount(totalShielded, contractState.tokenDecimals)).toFixed(2)}`
    : "$0.00";

  useEffect(() => {
    if (txStatus === "success" || txStatus === "error") {
      const timer = setTimeout(resetTx, 5000);
      return () => clearTimeout(timer);
    }
  }, [txStatus, resetTx]);

  const handleDeposit = () => {
    if (!depositAmount || txStatus !== "idle") return;
    deposit(depositAmount);
  };

  const handleWithdraw = () => {
    if (txStatus !== "idle") return;
    if (selectedNoteId) {
      const recipient = recipientAddress || wallet.address || "";
      withdraw(selectedNoteId, "", recipient, true);
    } else {
      if (!withdrawAmount || !withdrawSecret) return;
      const recipient = recipientAddress || wallet.address || "";
      withdraw(withdrawSecret, withdrawAmount, recipient, false);
    }
  };

  const copyAddress = () => {
    if (wallet.address) navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDepositBusy = txStatus === "approving" || txStatus === "depositing";
  const isWithdrawBusy = txStatus === "withdrawing";

  const ThemeToggle = () => (
    <button
      onClick={() => setIsDark(!isDark)}
      style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${t.CARD_BORDER}`, background: t.INPUT_BG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
    >
      {isDark
        ? <Sun style={{ width: 16, height: 16, color: "#fbbf24" }} />
        : <Moon style={{ width: 16, height: 16, color: t.TEXT_MUTED }} />}
    </button>
  );

  const TxFeedback = ({ type }: { type: "deposit" | "withdraw" }) => {
    if (txStatus === "idle") return null;
    const busy = type === "deposit" ? isDepositBusy : isWithdrawBusy;
    if (!busy && txStatus !== "success" && txStatus !== "error") return null;

    if (txStatus === "success") {
      return (
        <div style={{ padding: "14px", background: t.SUCCESS_BG, borderRadius: 10, border: `1.5px solid ${t.SUCCESS_BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 style={{ width: 18, height: 18, color: t.SUCCESS_COLOR, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: t.SUCCESS_COLOR, fontWeight: 700, fontSize: 14 }}>
              {type === "deposit" ? "Deposit confirmed! Note saved." : "Withdrawal sent!"}
            </p>
            {txHash && (
              <a
                href={`https://explorer.arc.fun/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: t.PP_BLUE, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2 }}
              >
                View on explorer <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            )}
          </div>
        </div>
      );
    }

    if (txStatus === "error") {
      return (
        <div style={{ padding: "14px", background: t.ERROR_BG, borderRadius: 10, border: `1.5px solid ${t.ERROR_BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
          <XCircle style={{ width: 18, height: 18, color: t.ERROR_COLOR, flexShrink: 0 }} />
          <p style={{ margin: 0, color: t.ERROR_COLOR, fontWeight: 600, fontSize: 13 }}>{txError}</p>
        </div>
      );
    }

    return null;
  };

  const spinner = (color = "#6b7280") => (
    <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
  );

  /* ── DISCONNECTED ── */
  if (!wallet.address) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: t.BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: ${t.TEXT_DIM}; }`}</style>

        <div style={{ background: t.NAV_BG, borderBottom: `1px solid ${t.CARD_BORDER}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: t.TEXT, fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>Arcpay</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: t.TEXT_MUTED, fontSize: 12 }}>Powered by zkShield</span>
            <ThemeToggle />
          </div>
        </div>

        <div style={{ background: t.HERO_BG, padding: "40px 24px 60px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Lock style={{ width: 32, height: 32, color: "white" }} />
          </div>
          <h1 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Private Payments,<br />Made Simple
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Send and receive {contractState.tokenSymbol} with complete privacy on Arc Blockchain.
          </p>
        </div>

        <div style={{ margin: "20px 20px 0" }}>
          <div style={{ background: t.CARD, borderRadius: 16, border: `1px solid ${t.CARD_BORDER}`, boxShadow: isDark ? "0 4px 32px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.08)", padding: "28px 24px 24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: t.TEXT, margin: "0 0 6px" }}>Connect your wallet</h2>
            <p style={{ fontSize: 13, color: t.TEXT_MUTED, margin: "0 0 24px", lineHeight: 1.5 }}>
              Link your Web3 wallet to start making private {contractState.tokenSymbol} transfers.
            </p>

            {wallet.error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.ERROR_BG, border: `1px solid ${t.ERROR_BORDER}`, borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                <AlertCircle style={{ width: 15, height: 15, color: t.ERROR_COLOR, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: t.ERROR_COLOR }}>{wallet.error}</span>
              </div>
            )}

            <button
              onClick={wallet.connect}
              disabled={wallet.connecting}
              style={{ width: "100%", padding: "14px", borderRadius: 10, background: wallet.connecting ? t.INPUT_BG : t.PP_BLUE, color: wallet.connecting ? t.TEXT_MUTED : "white", fontWeight: 700, fontSize: 15, border: wallet.connecting ? `1px solid ${t.CARD_BORDER}` : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
            >
              {wallet.connecting ? <>{spinner()} Connecting...</> : <><Wallet style={{ width: 18, height: 18 }} /> Connect Wallet</>}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: t.CARD_BORDER }} />
              <span style={{ fontSize: 12, color: t.TEXT_DIM }}>Supports MetaMask, WalletConnect & more</span>
              <div style={{ flex: 1, height: 1, background: t.CARD_BORDER }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: <Shield style={{ width: 16, height: 16, color: t.PP_BLUE }} />, text: "zk-SNARK proofs — the link between sender and recipient is broken on-chain" },
                { icon: <Lock style={{ width: 16, height: 16, color: t.PP_BLUE }} />, text: "Non-custodial — you hold your own secret notes, no one else can access your funds" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: t.PP_BLUE_LIGHT, border: `1px solid rgba(59,158,255,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <p style={{ fontSize: 13, color: t.TEXT_MUTED, margin: 0, lineHeight: 1.5, paddingTop: 5 }}>{f.text}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: "10px 14px", background: t.INPUT_BG, borderRadius: 8, border: `1px solid ${t.INPUT_BORDER}` }}>
              <p style={{ margin: 0, fontSize: 11, color: t.TEXT_MUTED, textAlign: "center" }}>
                Pool contract: <span style={{ fontFamily: "monospace", color: t.TEXT_DIM }}>{POOL_ADDRESS.slice(0, 10)}…{POOL_ADDRESS.slice(-8)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── CONNECTED ── */
  return (
    <div style={{ minHeight: "100vh", background: t.BG, fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: ${t.TEXT_DIM}; }`}</style>

      <div style={{ background: t.NAV_BG, borderBottom: `1px solid ${t.CARD_BORDER}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <span style={{ color: t.TEXT, fontWeight: 700, fontSize: 16 }}>Arcpay</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {contractState.paused && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: t.ERROR_BG, border: `1px solid ${t.ERROR_BORDER}`, borderRadius: 6, padding: "3px 8px" }}>
              <AlertCircle style={{ width: 12, height: 12, color: t.ERROR_COLOR }} />
              <span style={{ fontSize: 11, color: t.ERROR_COLOR, fontWeight: 600 }}>Paused</span>
            </div>
          )}
          <Bell style={{ width: 18, height: 18, color: t.TEXT_MUTED, cursor: "pointer" }} />
          <Settings style={{ width: 18, height: 18, color: t.TEXT_MUTED, cursor: "pointer" }} />
          <ThemeToggle />
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 6px", borderRadius: 20, border: `1px solid ${t.CARD_BORDER}`, background: t.INPUT_BG, cursor: "pointer" }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: t.PP_BLUE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: 12, height: 12, color: t.PP_BLUE }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.TEXT, fontFamily: "monospace" }}>
                {shortenAddress(wallet.address)}
              </span>
            </button>
            {showProfileMenu && (
              <>
                <div onClick={() => setShowProfileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: t.CARD, border: `1px solid ${t.CARD_BORDER}`, borderRadius: 12, boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 200, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: `1px solid ${t.SEPARATOR}` }}>
                    <p style={{ margin: 0, fontSize: 11, color: t.TEXT_MUTED }}>Connected wallet</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 600, color: t.TEXT, fontFamily: "monospace" }}>{shortenAddress(wallet.address)}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: t.TEXT_MUTED }}>Chain ID: {wallet.chainId}</p>
                  </div>
                  <button
                    onClick={() => { wallet.disconnect(); setShowProfileMenu(false); }}
                    style={{ width: "100%", padding: "11px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: t.ERROR_COLOR, fontSize: 13, fontWeight: 600, textAlign: "left" }}
                  >
                    <XCircle style={{ width: 15, height: 15 }} />
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Wrong network banner */}
      {wrongNetwork && (
        <div style={{ background: "#78350f", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle style={{ width: 15, height: 15, color: "#fbbf24", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#fde68a" }}>
              Switch to <strong>Arc Blockchain</strong> (chain {ARC_CHAIN_ID}) to use Arcpay
            </span>
          </div>
          <button
            onClick={handleSwitchNetwork}
            disabled={switchingNetwork}
            style={{ padding: "6px 14px", borderRadius: 8, background: "#fbbf24", border: "none", color: "#78350f", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}
          >
            {switchingNetwork ? "Switching…" : "Switch Network"}
          </button>
        </div>
      )}

      {/* Balance Hero */}
      <div style={{ background: t.HERO_BG, padding: "28px 24px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "monospace" }}>
            {shortenAddress(wallet.address)}
          </span>
          <button onClick={copyAddress} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            {copied
              ? <CheckCircle2 style={{ width: 13, height: 13, color: "#4ade80" }} />
              : <Copy style={{ width: 13, height: 13, color: "rgba(255,255,255,0.4)" }} />}
          </button>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginLeft: 4 }}>
            Chain {wallet.chainId}
          </span>
        </div>
        {/* Wallet token balance */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "0 0 2px" }}>
            Wallet {contractState.tokenSymbol} Balance
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <p style={{ color: contractState.loadError ? t.ERROR_COLOR : "white", fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
              {balanceVisible
                ? contractState.loadingBalance
                  ? "…"
                  : contractState.loadError
                    ? "Error"
                    : contractState.walletBalance === "—"
                      ? "—"
                      : `${parseFloat(contractState.walletBalance).toFixed(2)}`
                : "•••••"}
            </p>
            <button
              onClick={refreshBalance}
              disabled={contractState.loadingBalance}
              title="Refresh balance"
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <RefreshCw style={{ width: 13, height: 13, color: "rgba(255,255,255,0.7)", animation: contractState.loadingBalance ? "spin 1s linear infinite" : "none" }} />
            </button>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {balanceVisible
                ? <Eye style={{ width: 13, height: 13, color: "rgba(255,255,255,0.7)" }} />
                : <EyeOff style={{ width: 13, height: 13, color: "rgba(255,255,255,0.7)" }} />}
            </button>
          </div>
          {contractState.loadError && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(248,113,113,0.85)" }}>
              ⚠ {contractState.loadError}
            </p>
          )}
        </div>

        {/* Shielded (notes-based) balance */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "6px 14px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Shielded Notes</p>
            <p style={{ color: "white", fontSize: 15, fontWeight: 700, margin: 0 }}>
              {balanceVisible ? totalShieldedFormatted : "$•••••"}
            </p>
          </div>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Notes</p>
            <p style={{ color: "white", fontSize: 15, fontWeight: 700, margin: 0 }}>{notes.filter((n) => !n.spent).length}</p>
          </div>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", marginTop: 10 }}>
          <Shield style={{ width: 12, height: 12, color: "#4ade80" }} />
          <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 600 }}>Shielded by zk-SNARKs</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ margin: "16px 16px 0", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Action card */}
        <div style={{ background: t.CARD, borderRadius: 16, border: `1px solid ${t.CARD_BORDER}`, boxShadow: isDark ? "0 4px 32px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${t.CARD_BORDER}` }}>
            {[
              { key: "deposit", label: "Deposit", icon: <ArrowDownToLine style={{ width: 15, height: 15 }} /> },
              { key: "withdraw", label: "Withdraw", icon: <ArrowUpFromLine style={{ width: 15, height: 15 }} /> },
              { key: "notes", label: "My Notes", icon: <Key style={{ width: 15, height: 15 }} /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{ flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? t.PP_BLUE : t.TEXT_MUTED, borderBottom: activeTab === tab.key ? `2px solid ${t.PP_BLUE}` : "2px solid transparent", marginBottom: -1, transition: "all 0.15s" }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "20px 20px 24px" }}>
            {/* ── DEPOSIT ── */}
            {activeTab === "deposit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: t.TEXT_MUTED, display: "block", marginBottom: 6 }}>
                    Amount ({contractState.tokenSymbol})
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: t.TEXT_DIM, fontWeight: 500 }}>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      disabled={isDepositBusy}
                      style={{ width: "100%", padding: "13px 14px 13px 36px", fontSize: 22, fontWeight: 700, color: t.TEXT, border: `1.5px solid ${t.INPUT_BORDER}`, borderRadius: 10, outline: "none", boxSizing: "border-box", background: t.INPUT_BG, fontFamily: "inherit", opacity: isDepositBusy ? 0.5 : 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {["100", "500", "1000"].map((amt) => (
                    <button key={amt} onClick={() => setDepositAmount(amt)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${depositAmount === amt ? t.PP_BLUE : t.INPUT_BORDER}`, background: depositAmount === amt ? t.PP_BLUE_LIGHT : t.INPUT_BG, color: depositAmount === amt ? t.PP_BLUE : t.TEXT_MUTED, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      ${amt}
                    </button>
                  ))}
                </div>

                <div style={{ background: t.INPUT_BG, border: `1px solid ${t.INPUT_BORDER}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: t.TEXT_MUTED }}>Privacy fee</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.TEXT }}>
                      {contractState.feeBps > 0n ? `${Number(contractState.feeBps) / 100}%` : "0%"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: t.TEXT_MUTED }}>Token</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.TEXT }}>{contractState.tokenSymbol}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: t.TEXT_MUTED }}>Secret auto-saved</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.DEPOSIT_COLOR }}>Yes</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: t.PP_BLUE_LIGHT, border: `1px solid rgba(59,158,255,0.2)`, borderRadius: 10, padding: "12px 14px" }}>
                  <Info style={{ width: 15, height: 15, color: t.PP_BLUE, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: t.TEXT_MUTED, lineHeight: 1.5 }}>
                    Your secret note is saved automatically — you'll need it to withdraw later. Never share it.
                  </p>
                </div>

                <TxFeedback type="deposit" />

                {txStatus !== "success" && txStatus !== "error" && (
                  <button
                    onClick={handleDeposit}
                    disabled={!depositAmount || isDepositBusy || contractState.paused}
                    style={{ width: "100%", padding: "14px", borderRadius: 10, background: !depositAmount || isDepositBusy || contractState.paused ? t.INPUT_BG : t.PP_BLUE, color: !depositAmount || isDepositBusy || contractState.paused ? t.TEXT_MUTED : "white", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", border: !depositAmount || isDepositBusy || contractState.paused ? `1px solid ${t.INPUT_BORDER}` : "none" }}
                  >
                    {txStatus === "approving" ? <>{spinner()} Approving {contractState.tokenSymbol}...</>
                      : txStatus === "depositing" ? <>{spinner()} Shielding & Depositing...</>
                        : <><ArrowDownToLine style={{ width: 16, height: 16 }} /> Shield & Deposit</>}
                  </button>
                )}
              </div>
            )}

            {/* ── WITHDRAW ── */}
            {activeTab === "withdraw" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {notes.filter((n) => !n.spent).length > 0 && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: t.TEXT_MUTED, display: "block", marginBottom: 6 }}>Use a saved note</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {notes.filter((n) => !n.spent).map((note) => (
                        <button
                          key={note.id}
                          onClick={() => { setSelectedNoteId(selectedNoteId === note.id ? null : note.id); setWithdrawSecret(""); }}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${selectedNoteId === note.id ? t.PP_BLUE : t.INPUT_BORDER}`, background: selectedNoteId === note.id ? t.PP_BLUE_LIGHT : t.INPUT_BG, color: t.TEXT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}
                        >
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.TEXT }}>${parseFloat(note.amountFormatted).toFixed(2)} {contractState.tokenSymbol}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: t.TEXT_MUTED, fontFamily: "monospace" }}>
                              {new Date(note.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedNoteId === note.id && <CheckCircle2 style={{ width: 16, height: 16, color: t.PP_BLUE }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedNoteId && (
                  <>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: t.TEXT_MUTED, display: "block", marginBottom: 6 }}>
                        Secret (bytes32)
                      </label>
                      <input
                        placeholder="0x..."
                        value={withdrawSecret}
                        onChange={(e) => setWithdrawSecret(e.target.value)}
                        style={{ width: "100%", padding: "12px 14px", fontSize: 12, color: t.TEXT, fontFamily: "monospace", border: `1.5px solid ${t.INPUT_BORDER}`, borderRadius: 10, outline: "none", boxSizing: "border-box", background: t.INPUT_BG }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: t.TEXT_MUTED, display: "block", marginBottom: 6 }}>
                        Amount ({contractState.tokenSymbol})
                      </label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: t.TEXT_DIM }}>$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          style={{ width: "100%", padding: "13px 14px 13px 36px", fontSize: 22, fontWeight: 700, color: t.TEXT, border: `1.5px solid ${t.INPUT_BORDER}`, borderRadius: 10, outline: "none", boxSizing: "border-box", background: t.INPUT_BG, fontFamily: "inherit" }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: t.TEXT_MUTED, display: "block", marginBottom: 6 }}>
                    Recipient address <span style={{ color: t.TEXT_DIM, fontWeight: 400 }}>(leave blank for your wallet)</span>
                  </label>
                  <input
                    placeholder={`0x... (defaults to ${shortenAddress(wallet.address)})`}
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px", fontSize: 13, color: t.TEXT, fontFamily: "monospace", border: `1.5px solid ${t.INPUT_BORDER}`, borderRadius: 10, outline: "none", boxSizing: "border-box", background: t.INPUT_BG }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: t.PP_BLUE_LIGHT, border: `1px solid rgba(59,158,255,0.2)`, borderRadius: 10, padding: "12px 14px" }}>
                  <Info style={{ width: 15, height: 15, color: t.PP_BLUE, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: t.TEXT_MUTED, lineHeight: 1.5 }}>
                    A zk-SNARK proof severs any on-chain link between your depositing and withdrawing address.
                  </p>
                </div>

                <TxFeedback type="withdraw" />

                {txStatus !== "success" && txStatus !== "error" && (
                  <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawBusy || contractState.paused || (!selectedNoteId && (!withdrawAmount || !withdrawSecret))}
                    style={{ width: "100%", padding: "14px", borderRadius: 10, background: isWithdrawBusy || contractState.paused || (!selectedNoteId && (!withdrawAmount || !withdrawSecret)) ? t.INPUT_BG : t.PP_BLUE, color: isWithdrawBusy || contractState.paused || (!selectedNoteId && (!withdrawAmount || !withdrawSecret)) ? t.TEXT_MUTED : "white", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", border: isWithdrawBusy || contractState.paused || (!selectedNoteId && (!withdrawAmount || !withdrawSecret)) ? `1px solid ${t.INPUT_BORDER}` : "none" }}
                  >
                    {txStatus === "withdrawing"
                      ? <>{spinner()} Verifying & Withdrawing...</>
                      : <><ArrowUpFromLine style={{ width: 16, height: 16 }} /> Withdraw Privately</>}
                  </button>
                )}
              </div>
            )}

            {/* ── MY NOTES ── */}
            {activeTab === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: isDark ? "rgba(251,191,36,0.08)" : "#fef9ec", border: `1px solid ${isDark ? "rgba(251,191,36,0.2)" : "#fde68a"}`, borderRadius: 10, padding: "12px 14px" }}>
                  <Info style={{ width: 15, height: 15, color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: t.TEXT_MUTED, lineHeight: 1.5 }}>
                    Notes are stored in this browser. Back up your secrets — if you clear browser data, you lose access to unspent funds.
                  </p>
                </div>

                {notes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: t.TEXT_MUTED }}>
                    <Key style={{ width: 32, height: 32, margin: "0 auto 10px", opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>No notes yet</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12 }}>Deposit to generate your first private note</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} style={{ padding: "14px", background: note.spent ? t.INPUT_BG : t.CARD, border: `1px solid ${note.spent ? t.INPUT_BORDER : t.CARD_BORDER}`, borderRadius: 10, opacity: note.spent ? 0.5 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: note.spent ? t.TEXT_DIM : t.DEPOSIT_COLOR }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: t.TEXT }}>
                            ${parseFloat(note.amountFormatted).toFixed(2)} {contractState.tokenSymbol}
                          </span>
                          {note.spent && <span style={{ fontSize: 11, color: t.TEXT_DIM, background: t.INPUT_BG, border: `1px solid ${t.INPUT_BORDER}`, borderRadius: 4, padding: "1px 6px" }}>Spent</span>}
                        </div>
                        <span style={{ fontSize: 11, color: t.TEXT_MUTED }}>{new Date(note.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: t.TEXT_DIM, width: 60, flexShrink: 0 }}>Secret</span>
                          <code style={{ fontSize: 10, color: t.TEXT_MUTED, background: t.INPUT_BG, border: `1px solid ${t.INPUT_BORDER}`, borderRadius: 4, padding: "2px 6px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {note.secret}
                          </code>
                          <button onClick={() => navigator.clipboard.writeText(note.secret)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: t.TEXT_MUTED }}>
                            <Copy style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: t.TEXT_DIM, width: 60, flexShrink: 0 }}>Tx</span>
                          <a href={`https://explorer.arc.fun/tx/${note.txHash}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: t.PP_BLUE, fontFamily: "monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                            {note.txHash.slice(0, 14)}… <ExternalLink style={{ width: 10, height: 10 }} />
                          </a>
                        </div>
                      </div>
                      {!note.spent && (
                        <button
                          onClick={() => { setActiveTab("withdraw"); setSelectedNoteId(note.id); }}
                          style={{ marginTop: 10, width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${t.INPUT_BORDER}`, background: t.INPUT_BG, color: t.PP_BLUE, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          Withdraw this note →
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent on-chain activity section */}
        <div style={{ background: t.CARD, borderRadius: 16, border: `1px solid ${t.CARD_BORDER}`, overflow: "hidden", marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.TEXT }}>My Activity</span>
            <button style={{ display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: t.PP_BLUE, fontSize: 13, fontWeight: 600 }}>
              All <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${t.SEPARATOR}` }}>
            {notes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: t.TEXT_MUTED }}>
                <Clock style={{ width: 24, height: 24, margin: "0 auto 8px", opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: 13 }}>No transactions yet</p>
              </div>
            ) : (
              notes.slice(0, 4).map((note, i) => (
                <div key={note.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < Math.min(notes.length, 4) - 1 ? `1px solid ${t.SEPARATOR}` : "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: note.spent ? t.WITHDRAW_ICON : t.DEPOSIT_ICON, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {note.spent
                      ? <ArrowUpFromLine style={{ width: 17, height: 17, color: t.WITHDRAW_COLOR }} />
                      : <ArrowDownToLine style={{ width: 17, height: 17, color: t.DEPOSIT_COLOR }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.TEXT }}>
                      {note.spent ? "Private Withdrawal" : "Shield Deposit"}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: t.TEXT_MUTED, fontFamily: "monospace" }}>
                      {shortenAddress(wallet.address || "")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: note.spent ? t.WITHDRAW_COLOR : t.DEPOSIT_COLOR }}>
                      {note.spent ? "-" : "+"}{parseFloat(note.amountFormatted).toFixed(2)}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: t.TEXT_MUTED }}>
                      {new Date(note.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: t.NAV_BG, borderTop: `1px solid ${t.CARD_BORDER}`, display: "flex", alignItems: "center", boxShadow: isDark ? "0 -4px 20px rgba(0,0,0,0.4)" : "0 -2px 10px rgba(0,0,0,0.06)" }}>
        {[
          { key: "home", icon: <HomeIcon style={{ width: 20, height: 20 }} />, label: "Home" },
          { key: "deposit", icon: <ArrowDownToLine style={{ width: 20, height: 20 }} />, label: "Deposit" },
          { key: "withdraw", icon: <ArrowUpFromLine style={{ width: 20, height: 20 }} />, label: "Withdraw" },
          { key: "notes", icon: <Key style={{ width: 20, height: 20 }} />, label: "Notes" },
          { key: "profile", icon: <User style={{ width: 20, height: 20 }} />, label: "Profile" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setActiveNav(item.key);
              if (item.key === "deposit") setActiveTab("deposit");
              else if (item.key === "withdraw") setActiveTab("withdraw");
              else if (item.key === "notes") setActiveTab("notes");
            }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: activeNav === item.key ? t.PP_BLUE : t.TEXT_MUTED }}
          >
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: activeNav === item.key ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
