export const ARC_CHAIN_ID = 5042002;

export const ARC_CHAIN_PARAMS = {
  chainId: `0x${ARC_CHAIN_ID.toString(16)}`,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "ARC", symbol: "ARC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://explorer.arc.fun"],
};

export async function addArcNetwork() {
  if (!window.ethereum) throw new Error("No wallet found");
  await (window.ethereum as Record<string, unknown> & {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  }).request({
    method: "wallet_addEthereumChain",
    params: [ARC_CHAIN_PARAMS],
  });
}

export async function switchToArc() {
  if (!window.ethereum) throw new Error("No wallet found");
  const eth = window.ethereum as Record<string, unknown> & {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_PARAMS.chainId }],
    });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 4902) {
      await addArcNetwork();
    } else {
      throw err;
    }
  }
}
