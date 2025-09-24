import { defineConfig } from "@wagmi/cli";
import { react, actions } from "@wagmi/cli/plugins";
import { base } from "viem/chains";
import { leverageManagerAbi } from "./src/lib/contracts/abis/leverageManager";
import { leverageManagerV2Abi } from "./src/lib/contracts/abis/leverageManagerV2";
import { leverageRouterAbi } from "./src/lib/contracts/abis/leverageRouter";
import { leverageTokenAbi } from "./src/lib/contracts/abis/leverageToken";
import { leverageRouterV2Abi } from "./src/lib/contracts/abis/leverageRouterV2";
import { leverageTokenFactoryAbi } from "./src/lib/contracts/abis/leverageTokenFactory";
import { seamTokenAbi } from "./src/lib/contracts/abis/seamToken";
import { contractAddresses } from "./src/lib/contracts/addresses";

export default defineConfig({
  out: "src/lib/contracts/generated.ts",
  contracts: [
    {
      name: "LeverageToken",
      abi: leverageTokenAbi,
    },
    {
      name: "LeverageTokenFactory",
      abi: leverageTokenFactoryAbi,
      address: contractAddresses[base.id]?.leverageTokenFactory
        ? { [base.id]: contractAddresses[base.id]?.leverageTokenFactory! }
        : undefined,
    },
    {
      name: "LeverageRouter",
      abi: leverageRouterAbi,
      address: contractAddresses[base.id]?.leverageRouterV2
        ? { [base.id]: contractAddresses[base.id]?.leverageRouterV2! }
        : undefined,
    },
    {
      name: "LeverageRouterV2",
      abi: leverageRouterV2Abi,
      // Distinct address when deployed; omit mapping if unknown
      address: contractAddresses[base.id]?.leverageRouterV2
        ? { [base.id]: contractAddresses[base.id]?.leverageRouterV2! }
        : undefined,
    },
    {
      name: "LeverageManager",
      abi: leverageManagerAbi,
      address: contractAddresses[base.id]?.leverageManagerV2
        ? { [base.id]: contractAddresses[base.id]?.leverageManagerV2! }
        : undefined,
    },
    {
      name: "LeverageManagerV2",
      abi: leverageManagerV2Abi,
      // Distinct address when deployed; omit mapping if unknown
      address: contractAddresses[base.id]?.leverageManagerV2
        ? { [base.id]: contractAddresses[base.id]?.leverageManagerV2! }
        : undefined,
    },
    {
      name: "SeamToken",
      abi: seamTokenAbi,
      address: contractAddresses[base.id]?.seamlessToken
        ? { [base.id]: contractAddresses[base.id]?.seamlessToken! }
        : undefined,
    },
  ],
  plugins: [
    react({
      // Generate React hooks for read/write operations
    }),
    actions(), // Generate non-React viem actions for domain usage
  ],
});
