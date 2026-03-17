import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronRight,
  Zap,
  Lock,
} from "lucide-react";

type WalletState = "disconnected" | "connecting" | "connected";
type TxState = "idle" | "pending" | "success" | "error";

const MOCK_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const SHORT_ADDR = `${MOCK_ADDRESS.slice(0, 6)}...${MOCK_ADDRESS.slice(-4)}`;
const MOCK_BALANCE = "2.4150";
const MOCK_POOL_BALANCE = "1.0000";

const recentActivity = [
  { type: "deposit", amount: "1.0000", note: "Private deposit", time: "2h ago", status: "confirmed" },
  { type: "withdrawal", amount: "0.5000", note: "Shielded withdrawal", time: "1d ago", status: "confirmed" },
  { type: "deposit", amount: "0.5000", note: "Private deposit", time: "3d ago", status: "confirmed" },
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
  const [activeTab, setActiveTab] = useState("deposit");

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

  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{
        background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f0a 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="w-full max-w-md p-4 pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #00ff87 0%, #00d4ff 100%)" }}
            >
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">PrivacyPool</p>
              <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>zkShield Protocol</p>
            </div>
          </div>

          {wallet === "connected" ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: "#111827", border: "1px solid #1f2937" }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-300">{SHORT_ADDR}</span>
              <button onClick={copyAddress}>
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={wallet === "connecting"}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background:
                  wallet === "connecting"
                    ? "#1a2a1a"
                    : "linear-gradient(135deg, #00ff87 0%, #00d4ff 100%)",
                color: wallet === "connecting" ? "#4ade80" : "#000",
                border: wallet === "connecting" ? "1px solid #1f3a1f" : "none",
              }}
            >
              {wallet === "connecting" ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </>
              )}
            </button>
          )}
        </div>

        {wallet !== "connected" ? (
          /* Disconnected State */
          <div className="space-y-6">
            {/* Hero Card */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "linear-gradient(135deg, #0d1f0d 0%, #0a1a2a 100%)",
                border: "1px solid #1a3a1a",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, #00ff8722 0%, #00d4ff22 100%)" }}
              >
                <Lock className="w-8 h-8" style={{ color: "#00ff87" }} />
              </div>
              <h1 className="text-white text-xl font-bold mb-2">Private Payments, On-Chain</h1>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
                Shield your ETH transactions with zero-knowledge proofs. Send and receive with full privacy.
              </p>
              <button
                onClick={handleConnect}
                disabled={wallet === "connecting"}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background:
                    wallet === "connecting"
                      ? "#1a2a1a"
                      : "linear-gradient(135deg, #00ff87 0%, #00d4ff 100%)",
                  color: wallet === "connecting" ? "#4ade80" : "#000",
                }}
              >
                {wallet === "connecting" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                    Connecting to Wallet...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Wallet className="w-4 h-4" /> Connect Wallet to Start
                  </span>
                )}
              </button>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Shield className="w-4 h-4" />, label: "zk-SNARK", sub: "Privacy" },
                { icon: <Zap className="w-4 h-4" />, label: "Instant", sub: "Settlement" },
                { icon: <Lock className="w-4 h-4" />, label: "Non-custodial", sub: "Protocol" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "#111827", border: "1px solid #1f2937" }}
                >
                  <div className="flex justify-center mb-1.5" style={{ color: "#00ff87" }}>
                    {f.icon}
                  </div>
                  <p className="text-white text-xs font-semibold">{f.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>{f.sub}</p>
                </div>
              ))}
            </div>

            {/* Trust Row */}
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "#0d1a0d", border: "1px solid #1a3a1a" }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#00ff87" }} />
              <p className="text-xs" style={{ color: "#6b7280" }}>
                Smart contracts audited by{" "}
                <span style={{ color: "#00ff87" }}>Quantstamp & OpenZeppelin</span>
              </p>
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-4">
            {/* Balance Card */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "linear-gradient(135deg, #0d1f0d 0%, #071a07 100%)",
                border: "1px solid #1a3a1a",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs" style={{ color: "#6b7280" }}>Pool Balance (Shielded)</p>
                <button onClick={() => setBalanceVisible(!balanceVisible)}>
                  {balanceVisible ? (
                    <Eye className="w-4 h-4" style={{ color: "#4b5563" }} />
                  ) : (
                    <EyeOff className="w-4 h-4" style={{ color: "#4b5563" }} />
                  )}
                </button>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-white">
                  {balanceVisible ? MOCK_POOL_BALANCE : "••••••"}
                </span>
                <span className="text-lg mb-0.5" style={{ color: "#6b7280" }}>ETH</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                  style={{ background: "#1a3a1a" }}
                >
                  <Shield className="w-3 h-3" style={{ color: "#00ff87" }} />
                  <span style={{ color: "#00ff87" }}>Shielded</span>
                </div>
                <span className="text-xs" style={{ color: "#374151" }}>
                  Wallet: {balanceVisible ? MOCK_BALANCE : "•••"} ETH
                </span>
              </div>
            </div>

            {/* Action Tabs */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#0d111a", border: "1px solid #1f2937" }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div style={{ background: "#0a0d14", padding: "4px" }}>
                  <TabsList className="w-full grid grid-cols-2" style={{ background: "transparent" }}>
                    {[
                      { value: "deposit", label: "Deposit", icon: <ArrowDownToLine className="w-3.5 h-3.5" /> },
                      { value: "withdraw", label: "Withdraw", icon: <ArrowUpFromLine className="w-3.5 h-3.5" /> },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-1.5 text-sm font-medium rounded-lg transition-all"
                        style={{
                          color: activeTab === tab.value ? "#fff" : "#4b5563",
                          background:
                            activeTab === tab.value
                              ? tab.value === "deposit"
                                ? "linear-gradient(135deg, #00ff8722 0%, #00d4ff22 100%)"
                                : "#1f2937"
                              : "transparent",
                          border:
                            activeTab === tab.value
                              ? tab.value === "deposit"
                                ? "1px solid #00ff8740"
                                : "1px solid #374151"
                              : "1px solid transparent",
                        }}
                      >
                        {tab.icon} {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Deposit Tab */}
                <TabsContent value="deposit" className="p-4 space-y-4 mt-0">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>
                      Amount (ETH)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="text-white text-lg font-semibold pr-16"
                        style={{
                          background: "#070b12",
                          border: "1px solid #1f2937",
                          borderRadius: "12px",
                          height: "52px",
                          color: "white",
                        }}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: "#1a3a1a", color: "#00ff87" }}
                        onClick={() => setDepositAmount(MOCK_BALANCE)}
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {["0.1", "0.5", "1.0"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(amt)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: depositAmount === amt ? "#1a3a1a" : "#111827",
                          color: depositAmount === amt ? "#00ff87" : "#6b7280",
                          border: `1px solid ${depositAmount === amt ? "#1f5a1f" : "#1f2937"}`,
                        }}
                      >
                        {amt} ETH
                      </button>
                    ))}
                  </div>

                  {/* Info row */}
                  <div
                    className="rounded-xl p-3 space-y-2"
                    style={{ background: "#070b12", border: "1px solid #1a2030" }}
                  >
                    {[
                      { label: "Privacy fee", value: "0.1%" },
                      { label: "Network gas", value: "~$2.40" },
                      { label: "zk-proof time", value: "~3 sec" },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between text-xs">
                        <span style={{ color: "#4b5563" }}>{row.label}</span>
                        <span style={{ color: "#9ca3af" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status / Button */}
                  {depositTx === "success" ? (
                    <div
                      className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                      style={{ background: "#1a3a1a", color: "#4ade80" }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Deposit Confirmed!
                    </div>
                  ) : (
                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || depositTx === "pending"}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
                      style={{
                        background:
                          depositTx === "pending" || !depositAmount
                            ? "#1a2a1a"
                            : "linear-gradient(135deg, #00ff87 0%, #00d4ff 100%)",
                        color: depositTx === "pending" || !depositAmount ? "#4ade80" : "#000",
                      }}
                    >
                      {depositTx === "pending" ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                          Generating zk-Proof...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ArrowDownToLine className="w-4 h-4" /> Shield & Deposit
                        </span>
                      )}
                    </button>
                  )}
                </TabsContent>

                {/* Withdraw Tab */}
                <TabsContent value="withdraw" className="p-4 space-y-4 mt-0">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>
                      Recipient Address
                    </label>
                    <Input
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="font-mono text-sm"
                      style={{
                        background: "#070b12",
                        border: "1px solid #1f2937",
                        borderRadius: "12px",
                        height: "48px",
                        color: "white",
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "#9ca3af" }}>
                      Amount (ETH)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="text-white text-lg font-semibold pr-16"
                        style={{
                          background: "#070b12",
                          border: "1px solid #1f2937",
                          borderRadius: "12px",
                          height: "52px",
                          color: "white",
                        }}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: "#1f2937", color: "#9ca3af" }}
                        onClick={() => setWithdrawAmount(MOCK_POOL_BALANCE)}
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Privacy note */}
                  <div
                    className="rounded-xl p-3 flex items-start gap-2.5"
                    style={{ background: "#0d0d20", border: "1px solid #1a1a40" }}
                  >
                    <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#818cf8" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                      Withdrawal uses a zk-SNARK proof. The link between your depositing and withdrawing address is broken on-chain.
                    </p>
                  </div>

                  {withdrawTx === "success" ? (
                    <div
                      className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                      style={{ background: "#1a3a1a", color: "#4ade80" }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Withdrawal Sent!
                    </div>
                  ) : (
                    <button
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || !recipientAddress || withdrawTx === "pending"}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
                      style={{
                        background:
                          withdrawTx === "pending" || !withdrawAmount || !recipientAddress
                            ? "#1f2937"
                            : "#374151",
                        color:
                          withdrawTx === "pending" || !withdrawAmount || !recipientAddress
                            ? "#4b5563"
                            : "#e5e7eb",
                        border: "1px solid #374151",
                      }}
                    >
                      {withdrawTx === "pending" ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                          Verifying Proof...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ArrowUpFromLine className="w-4 h-4" /> Withdraw Privately
                        </span>
                      )}
                    </button>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Activity */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#0d111a", border: "1px solid #1f2937" }}
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Activity</p>
                <button className="text-xs flex items-center gap-1" style={{ color: "#4b5563" }}>
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <Separator style={{ background: "#1f2937" }} />
              <div className="divide-y" style={{ borderColor: "#111827" }}>
                {recentActivity.map((tx, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: tx.type === "deposit" ? "#0d1f0d" : "#1a1a0d",
                      }}
                    >
                      {tx.type === "deposit" ? (
                        <ArrowDownToLine className="w-4 h-4" style={{ color: "#00ff87" }} />
                      ) : (
                        <ArrowUpFromLine className="w-4 h-4" style={{ color: "#facc15" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium capitalize">{tx.type}</p>
                      <p className="text-xs truncate" style={{ color: "#4b5563" }}>{tx.note}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: tx.type === "deposit" ? "#00ff87" : "#facc15" }}
                      >
                        {tx.type === "deposit" ? "+" : "-"}{tx.amount} ETH
                      </p>
                      <p className="text-xs" style={{ color: "#374151" }}>{tx.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer links */}
            <div className="flex items-center justify-center gap-4">
              {["Contract", "Docs", "Audit"].map((link) => (
                <button
                  key={link}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#374151" }}
                >
                  {link} <ExternalLink className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
