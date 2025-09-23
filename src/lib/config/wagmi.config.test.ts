import type { Address, Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createConfig, http } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { mock } from "wagmi/connectors";

// Use a deterministic account for tests (Anvil default #0 unless overridden)
export const TEST_ADDRESS = (import.meta.env["VITE_TEST_ADDRESS"] ??
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") as Address;

export const anvilUrl =
  import.meta.env["VITE_ANVIL_RPC_URL"] ?? "http://127.0.0.1:8545";

// Parse RPC URL map for per-chain configuration
const rpcUrlMap: Record<string, string> = (() => {
  try {
    const mapString = import.meta.env["VITE_TEST_RPC_URL_MAP"];
    return mapString ? JSON.parse(mapString) : {};
  } catch {
    return {};
  }
})();

// Fallback RPC URL resolution
const fallbackRpcUrl: string =
  import.meta.env["VITE_TEST_RPC_URL"] ??
  import.meta.env["VITE_TENDERLY_RPC_URL"] ??
  import.meta.env["VITE_BASE_RPC_URL"] ??
  anvilUrl;

// Use chain-specific RPC URLs or fallback
const baseRpcUrl: string = rpcUrlMap["8453"] || fallbackRpcUrl;
const mainnetRpcUrl: string = rpcUrlMap["1"] || fallbackRpcUrl;

// Debug logging for RPC configuration
if (rpcUrlMap && Object.keys(rpcUrlMap).length > 0) {
  console.log("[wagmi-test] Using RPC URL map:", {
    base: baseRpcUrl,
    mainnet: mainnetRpcUrl,
  });
} else {
  console.log("[wagmi-test] Using fallback RPC:", fallbackRpcUrl);
}

const baseChain = {
  ...base,
  rpcUrls: {
    default: { http: [baseRpcUrl] },
    public: { http: [baseRpcUrl] },
  },
} satisfies Chain;

const mainnetChain = {
  ...mainnet,
  rpcUrls: {
    default: { http: [mainnetRpcUrl] },
    public: { http: [mainnetRpcUrl] },
  },
} satisfies Chain;

// ⚠️ test-only: Local Account signer for writes during E2E
const TEST_PRIVATE_KEY = import.meta.env["VITE_TEST_PRIVATE_KEY"] as
  | Address
  | undefined;
export const testLocalAccount = TEST_PRIVATE_KEY
  ? privateKeyToAccount(TEST_PRIVATE_KEY)
  : undefined;

// Use createConfig with mock connector for testing
const _testConfig = createConfig({
  chains: [baseChain, mainnetChain],
  connectors: [
    mock({
      accounts: [TEST_ADDRESS], // UI shows this address
      features: { reconnect: true },
    }),
  ],
  transports: {
    [base.id]: http(baseRpcUrl),
    [mainnet.id]: http(mainnetRpcUrl),
  },
  ssr: false,
});
