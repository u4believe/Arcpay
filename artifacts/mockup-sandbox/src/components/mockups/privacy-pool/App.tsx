import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronRight,
  Lock,
  Info,
  Bell,
  Settings,
  Home,
  Clock,
  User,
} from "lucide-react";

type WalletState = "disconnected" | "connecting" | "connected";
type TxState = "idle" | "pending" | "success";

const MOCK_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const SHORT_ADDR = `${MOCK_ADDRESS.slice(0, 6)}...${MOCK_ADDRESS.slice(-4)}`;
const MOCK_POOL_BALANCE = "$3,240.00";
const MOCK_POOL_ETH = "1.0000 ETH";

const PP_BLUE = "#3b9eff";
const PP_BLUE_DARK = "#003087";
const PP_BLUE_LIGHT = "rgba(59,158,255,0.12)";
const PP_BLUE_MID = "rgba(59,158,255,0.08)";

const BG = "#0a0a0f";
const CARD = "#13131c";
const CARD_BORDER = "#1e1e2e";
const INPUT_BG = "#0d0d16";
const INPUT_BORDER = "#252538";
const TEXT = "#f0f0f8";
const TEXT_MUTED = "#6b7280";
const TEXT_DIM = "#38384a";
const SEPARATOR = "#18181f";

const recentActivity = [
  { type: "deposit", amount: "+$1,640.00", label: "Shield Deposit", addr: "0x71C7...976F", time: "Today, 2:14 PM", status: "Completed" },
  { type: "withdrawal", amount: "-$820.00", label: "Private Withdrawal", addr: "0x4aF9...23Aa", time: "Yesterday, 9:00 AM", status: "Completed" },
  { type: "deposit", amount: "+$1,640.00", label: "Shield Deposit", addr: "0x71C7...976F", time: "Mar 14, 4:32 PM", status: "Completed" },
  { type: "withdrawal", amount: "-$820.00", label: "Private Withdrawal", addr: "0x2bC3...88Dd", time: "Mar 12, 11:15 AM", status: "Completed" },
];

export function App() {
  const [wallet, setWallet] = useState<WalletState>("disconnected");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [depositTx, setDepositTx] = useState<TxState>("idle");
  const [withdrawTx, setWithdrawTx] = useState<TxState>("idle");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [activeNav, setActiveNav] = useState("home");

  const handleConnect = () => {
    setWallet("connecting");
    setTimeout(() => setWallet("connected"), 1500);
  };

  const handleDeposit = () => {
    if (!depositAmount) return;
    setDepositTx("pending");
    setTimeout(() => {
      setDepositTx("success");
      setDepositAmount("");
      setTimeout(() => setDepositTx("idle"), 3000);
    }, 2000);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !recipientAddress) return;
    setWithdrawTx("pending");
    setTimeout(() => {
      setWithdrawTx("success");
      setWithdrawAmount("");
      setRecipientAddress("");
      setTimeout(() => setWithdrawTx("idle"), 3000);
    }, 2000);
  };

  const copyAddress = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── DISCONNECTED ── */
  if (wallet !== "connected") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Top bar */}
        <div style={{ background: "#0d0d16", borderBottom: `1px solid ${CARD_BORDER}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: PP_BLUE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield style={{ width: 16, height: 16, color: PP_BLUE }} />
            </div>
            <span style={{ color: TEXT, fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>PrivacyPool</span>
          </div>
          <span style={{ color: TEXT_MUTED, fontSize: 12 }}>Powered by zkShield</span>
        </div>

        {/* Hero section */}
        <div style={{ background: "linear-gradient(180deg, #0d0d16 0%, #0a0a0f 100%)", padding: "40px 24px 60px", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: PP_BLUE_LIGHT,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <Lock style={{ width: 32, height: 32, color: PP_BLUE }} />
          </div>
          <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Private Payments,<br />Made Simple
          </h1>
          <p style={{ color: TEXT_MUTED, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Send and receive USDC with complete privacy on Arc Blockchain.
          </p>
        </div>

        {/* Card panel */}
        <div style={{ margin: "20px 20px 0", position: "relative", zIndex: 1 }}>
          <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${CARD_BORDER}`, boxShadow: "0 4px 32px rgba(0,0,0,0.4)", padding: "28px 24px 24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: "0 0 6px" }}>Connect your wallet</h2>
            <p style={{ fontSize: 13, color: TEXT_MUTED, margin: "0 0 24px", lineHeight: 1.5 }}>
              Link your Web3 wallet to start depositing and withdrawing privately.
            </p>

            <button
              onClick={handleConnect}
              disabled={wallet === "connecting"}
              style={{
                width: "100%", padding: "14px", borderRadius: 10,
                background: wallet === "connecting" ? INPUT_BG : PP_BLUE,
                color: wallet === "connecting" ? TEXT_MUTED : "white",
                fontWeight: 700, fontSize: 15, border: wallet === "connecting" ? `1px solid ${CARD_BORDER}` : "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              {wallet === "connecting" ? (
                <>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${TEXT_MUTED}`, borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet style={{ width: 18, height: 18 }} />
                  Connect Wallet
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
              <span style={{ fontSize: 12, color: TEXT_DIM }}>Supports MetaMask, WalletConnect & more</span>
              <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
            </div>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: <Shield style={{ width: 16, height: 16, color: PP_BLUE }} />, text: "zk-SNARK privacy proofs — link between addresses is broken" },
                { icon: <Lock style={{ width: 16, height: 16, color: PP_BLUE }} />, text: "Non-custodial — you always control your funds" },
                { icon: <CheckCircle2 style={{ width: 16, height: 16, color: PP_BLUE }} />, text: "Audited by Quantstamp & OpenZeppelin" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: PP_BLUE_LIGHT, border: `1px solid rgba(59,158,255,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0, lineHeight: 1.5, paddingTop: 5 }}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── CONNECTED ── */
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Top Nav */}
      <div style={{ background: "#0d0d16", borderBottom: `1px solid ${CARD_BORDER}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: PP_BLUE_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield style={{ width: 14, height: 14, color: PP_BLUE }} />
          </div>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 16 }}>PrivacyPool</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Bell style={{ width: 18, height: 18, color: "rgba(255,255,255,0.7)", cursor: "pointer" }} />
          <Settings style={{ width: 18, height: 18, color: "rgba(255,255,255,0.7)", cursor: "pointer" }} />
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}>
            <User style={{ width: 16, height: 16, color: "white" }} />
          </div>
        </div>
      </div>

      {/* Balance hero */}
      <div style={{ background: "linear-gradient(180deg, #0d0d16 0%, #10101a 100%)", padding: "28px 24px 32px", textAlign: "center", borderBottom: `1px solid ${CARD_BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{SHORT_ADDR}</span>
            <button onClick={copyAddress} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              {copied
                ? <CheckCircle2 style={{ width: 13, height: 13, color: "#4ade80" }} />
                : <Copy style={{ width: 13, height: 13, color: "rgba(255,255,255,0.4)" }} />
              }
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 4px" }}>Shielded Balance</p>
            <p style={{ color: "white", fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: "-1px" }}>
              {balanceVisible ? MOCK_POOL_BALANCE : "$•••••••"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "4px 0 0" }}>
              {balanceVisible ? MOCK_POOL_ETH : "•••••• ETH"}
            </p>
          </div>
          <button
            onClick={() => setBalanceVisible(!balanceVisible)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: 20 }}
          >
            {balanceVisible
              ? <Eye style={{ width: 15, height: 15, color: "rgba(255,255,255,0.7)" }} />
              : <EyeOff style={{ width: 15, height: 15, color: "rgba(255,255,255,0.7)" }} />
            }
          </button>
        </div>

        {/* Shield badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", marginTop: 14 }}>
          <Shield style={{ width: 12, height: 12, color: "#4ade80" }} />
          <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 600 }}>Shielded by zk-SNARKs</span>
        </div>
      </div>

      {/* Main card */}
      <div style={{ margin: "16px 16px 0", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Action card */}
        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${CARD_BORDER}`, boxShadow: "0 4px 32px rgba(0,0,0,0.3)", overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: `1px solid ${CARD_BORDER}` }}>
            {[
              { key: "deposit", label: "Deposit", icon: <ArrowDownToLine style={{ width: 15, height: 15 }} /> },
              { key: "withdraw", label: "Withdraw", icon: <ArrowUpFromLine style={{ width: 15, height: 15 }} /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "deposit" | "withdraw")}
                style={{
                  flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 500,
                  color: activeTab === tab.key ? PP_BLUE : TEXT_MUTED,
                  borderBottom: activeTab === tab.key ? `2px solid ${PP_BLUE}` : "2px solid transparent",
                  marginBottom: -1, transition: "all 0.15s",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "20px 20px 24px" }}>
            {/* ── DEPOSIT FORM ── */}
            {activeTab === "deposit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Amount */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: "block", marginBottom: 6 }}>Amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: TEXT_DIM, fontWeight: 500 }}>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      style={{
                        width: "100%", padding: "13px 70px 13px 36px",
                        fontSize: 22, fontWeight: 700, color: TEXT,
                        border: `1.5px solid ${INPUT_BORDER}`, borderRadius: 10,
                        outline: "none", boxSizing: "border-box", background: INPUT_BG,
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={() => setDepositAmount("3240.00")}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        padding: "4px 10px", borderRadius: 6, border: "none",
                        background: PP_BLUE_LIGHT, color: PP_BLUE, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Quick amounts */}
                <div style={{ display: "flex", gap: 8 }}>
                  {["$100", "$500", "$1,000"].map((amt) => {
                    const v = amt.replace(/[$,]/g, "");
                    return (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(v)}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 8,
                          border: `1.5px solid ${depositAmount === v ? PP_BLUE : INPUT_BORDER}`,
                          background: depositAmount === v ? PP_BLUE_LIGHT : INPUT_BG,
                          color: depositAmount === v ? PP_BLUE : TEXT_MUTED,
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {amt}
                      </button>
                    );
                  })}
                </div>

                {/* Fee summary */}
                <div style={{ background: INPUT_BG, border: `1px solid ${INPUT_BORDER}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "Privacy fee", value: "0.1%" },
                    { label: "Estimated gas", value: "~$2.40" },
                    { label: "zk-proof generation", value: "~3 sec" },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: TEXT_MUTED }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {depositTx === "success" ? (
                  <div style={{ padding: "14px", background: "rgba(22,163,74,0.12)", borderRadius: 10, border: "1.5px solid rgba(22,163,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <CheckCircle2 style={{ width: 18, height: 18, color: "#4ade80" }} />
                    <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>Deposit confirmed!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleDeposit}
                    disabled={!depositAmount || depositTx === "pending"}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 10, border: "none",
                      background: !depositAmount || depositTx === "pending" ? INPUT_BG : PP_BLUE,
                      color: !depositAmount || depositTx === "pending" ? TEXT_MUTED : "white",
                      fontWeight: 700, fontSize: 15, cursor: !depositAmount || depositTx === "pending" ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
                      border: !depositAmount || depositTx === "pending" ? `1px solid ${INPUT_BORDER}` : "none",
                    }}
                  >
                    {depositTx === "pending" ? (
                      <>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${TEXT_MUTED}`, borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                        Generating zk-Proof...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine style={{ width: 16, height: 16 }} />
                        Shield & Deposit
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* ── WITHDRAW FORM ── */}
            {activeTab === "withdraw" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Recipient */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: "block", marginBottom: 6 }}>
                    Recipient Address
                  </label>
                  <input
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    style={{
                      width: "100%", padding: "12px 14px",
                      fontSize: 13, color: TEXT, fontFamily: "monospace",
                      border: `1.5px solid ${INPUT_BORDER}`, borderRadius: 10,
                      outline: "none", boxSizing: "border-box", background: INPUT_BG,
                    }}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, display: "block", marginBottom: 6 }}>Amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: TEXT_DIM, fontWeight: 500 }}>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      style={{
                        width: "100%", padding: "13px 70px 13px 36px",
                        fontSize: 22, fontWeight: 700, color: TEXT,
                        border: `1.5px solid ${INPUT_BORDER}`, borderRadius: 10,
                        outline: "none", boxSizing: "border-box", background: INPUT_BG,
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={() => setWithdrawAmount("3240.00")}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        padding: "4px 10px", borderRadius: 6, border: "none",
                        background: PP_BLUE_LIGHT, color: PP_BLUE, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Privacy note */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: PP_BLUE_LIGHT, border: `1px solid rgba(59,158,255,0.2)`, borderRadius: 10, padding: "12px 14px" }}>
                  <Info style={{ width: 15, height: 15, color: PP_BLUE, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED, lineHeight: 1.5 }}>
                    A zk-SNARK proof severs any on-chain link between your depositing and withdrawing address.
                  </p>
                </div>

                {/* CTA */}
                {withdrawTx === "success" ? (
                  <div style={{ padding: "14px", background: "rgba(22,163,74,0.12)", borderRadius: 10, border: "1.5px solid rgba(22,163,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <CheckCircle2 style={{ width: 18, height: 18, color: "#4ade80" }} />
                    <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>Withdrawal sent!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || !recipientAddress || withdrawTx === "pending"}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 10,
                      background: !withdrawAmount || !recipientAddress || withdrawTx === "pending" ? INPUT_BG : PP_BLUE,
                      color: !withdrawAmount || !recipientAddress || withdrawTx === "pending" ? TEXT_MUTED : "white",
                      fontWeight: 700, fontSize: 15, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
                      border: !withdrawAmount || !recipientAddress || withdrawTx === "pending" ? `1px solid ${INPUT_BORDER}` : "none",
                    }}
                  >
                    {withdrawTx === "pending" ? (
                      <>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${TEXT_MUTED}`, borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                        Verifying Proof...
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine style={{ width: 16, height: 16 }} />
                        Withdraw Privately
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity card */}
        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${CARD_BORDER}`, boxShadow: "0 4px 32px rgba(0,0,0,0.3)", overflow: "hidden", marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Recent Activity</span>
            <button style={{ display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: PP_BLUE, fontSize: 13, fontWeight: 600 }}>
              See all <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${SEPARATOR}` }}>
            {recentActivity.map((tx, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
                  borderBottom: i < recentActivity.length - 1 ? `1px solid ${SEPARATOR}` : "none",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: tx.type === "deposit" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {tx.type === "deposit"
                    ? <ArrowDownToLine style={{ width: 17, height: 17, color: "#4ade80" }} />
                    : <ArrowUpFromLine style={{ width: 17, height: 17, color: "#fbbf24" }} />
                  }
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TEXT }}>{tx.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: TEXT_MUTED, fontFamily: "monospace" }}>{tx.addr}</p>
                </div>
                {/* Amount + time */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: tx.type === "deposit" ? "#4ade80" : "#fbbf24" }}>
                    {tx.amount}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: TEXT_MUTED }}>{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
        background: "#0d0d16", borderTop: `1px solid ${CARD_BORDER}`,
        display: "flex", alignItems: "center",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
      }}>
        {[
          { key: "home", icon: <Home style={{ width: 20, height: 20 }} />, label: "Home" },
          { key: "deposit", icon: <ArrowDownToLine style={{ width: 20, height: 20 }} />, label: "Deposit" },
          { key: "withdraw", icon: <ArrowUpFromLine style={{ width: 20, height: 20 }} />, label: "Withdraw" },
          { key: "activity", icon: <Clock style={{ width: 20, height: 20 }} />, label: "Activity" },
          { key: "profile", icon: <User style={{ width: 20, height: 20 }} />, label: "Profile" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setActiveNav(item.key);
              if (item.key === "deposit") setActiveTab("deposit");
              if (item.key === "withdraw") setActiveTab("withdraw");
            }}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              color: activeNav === item.key ? PP_BLUE : TEXT_MUTED,
            }}
          >
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: activeNav === item.key ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
