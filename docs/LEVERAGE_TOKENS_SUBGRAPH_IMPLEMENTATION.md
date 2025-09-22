# Leverage Tokens Subgraph Implementation Guide

This document provides a comprehensive guide for implementing the `VITE_LEVERAGE_TOKENS_SUBGRAPH` functionality in another application, using this codebase as reference.

The main source code is in _sources on how it was used in the old repo

## Overview

The leverage tokens subgraph implementation provides historical data visualization and user profit calculations for leverage tokens. It uses Apollo Client with React Query for data fetching, caching, and state management.

## Environment Configuration

### Required Environment Variables

```bash
# Subgraph endpoint URL
VITE_LEVERAGE_TOKENS_SUBGRAPH=https://api.studio.thegraph.com/query/113147/seamless-leverage-tokens-base/version/latest

# API key for authentication
VITE_THEGRAPH_API_KEY=your_api_key_here
```

## Apollo Client Configuration

### File: `src/app/config/apollo-clients.ts`

```typescript
import { ApolloClient, InMemoryCache } from "@apollo/client";

const leverageTokenApolloClient = new ApolloClient({
  uri: import.meta.env.VITE_LEVERAGE_TOKENS_SUBGRAPH,
  cache: new InMemoryCache(),
  headers: {
    "Authorization": `Bearer ${import.meta.env.VITE_THEGRAPH_API_KEY}`,
  },
});

export const getLeverageTokenApolloClient = () => leverageTokenApolloClient;
```

## GraphQL Schema Configuration

### File: `codegen.yml`

```yaml
generates:
  src/generated-graphql/leverage-token-index.tsx:
    schema: "https://api.studio.thegraph.com/query/113147/seamless-leverage-tokens-base/version/latest"
    documents: "src/app/data/leverage-tokens/**/*.graphql"
    plugins:
      - "typescript"
      - "typescript-operations"
      - "typescript-react-apollo"
    config:
      withHooks: false
      withHOC: false
      withComponent: false
```

## GraphQL Queries

### 1. Leverage Token Value Historical Data

**File: `src/app/data/leverage-tokens/queries/leverage-token-value-historical/LeverageTokenValueHistorical.graphql`**

```graphql
query LeverageTokenValueHistorical($address: ID!, $first: Int, $skip: Int) {
  leverageToken(id: $address) {
    stateHistory(orderBy: timestamp, orderDirection: desc, first: $first, skip: $skip) {
      equityPerTokenInDebt
      timestamp
    }
  }
}
```

### 2. Collateral Price Historical Data

**File: `src/app/data/leverage-tokens/queries/collateral-price-historical/CollateralPriceHistorical.graphql`**

```graphql
query CollateralPriceHistorical($address: ID!, $first: Int, $skip: Int) {
  leverageToken(id: $address) {
    lendingAdapter {
      oracle {
        decimals
        priceUpdates(orderBy: timestamp, orderDirection: desc, first: $first, skip: $skip) {
          price
          timestamp
        }
      }
    }
  }
}
```

### 3. User Leverage Token Profit Data

**File: `src/app/data/leverage-tokens/queries/leverage-token-profit/user-leverage-token-profit.graphql`**

```graphql
query UserLeverageTokenProfit($userId: ID!, $leverageTokenId: String!) {
  user(id: $userId) {
    positions(where: { leverageToken: $leverageTokenId }) {
      id
      totalEquityDepositedInCollateral
      leverageToken {
        id
      }
    }
  }
}
```

## Data Fetching Implementation

### 1. Leverage Token Value Historical Fetch

**File: `src/app/data/leverage-tokens/queries/leverage-token-value-historical/LeverageTokenValueHistorical.fetch.ts`**

```typescript
import {
  LeverageTokenValueHistoricalDocument,
  LeverageTokenValueHistoricalQuery,
  LeverageTokenValueHistoricalQueryVariables,
} from "../../../../../generated-graphql/leverage-token-index";
import { getLeverageTokenApolloClient } from "../../../../config/apollo-clients";
import { getQueryClient } from "../../../../contexts/CustomQueryClientProvider";
import { queryConfig } from "../../../settings/queryConfig";
import { checkGraphQlResponse } from "../../../../v3/utils/utils";
import { MAX_HISTORICAL_DATA_POINTS } from "../../../../../meta/constants";

export const fetchLeverageTokenValueHistoricalQueryOptions = (variables: { address: string }) => ({
  queryKey: ["fetchLeverageTokenValueHistorical", variables.address],
  queryFn: async () => {
    const client = getLeverageTokenApolloClient();

    // 1000 is the maximum number of items that can be returned by the subgraph. If there are more
    // items, we need to paginate.
    let response;
    let skip = 0;

    while (skip < MAX_HISTORICAL_DATA_POINTS) {
      const result = await client.query<LeverageTokenValueHistoricalQuery, LeverageTokenValueHistoricalQueryVariables>({
        query: LeverageTokenValueHistoricalDocument,
        variables: { address: variables.address, first: 1000, skip },
        fetchPolicy: "no-cache",
      });

      checkGraphQlResponse(result);

      if (skip === 0) {
        response = result.data;
      } else if (response?.leverageToken && result.data.leverageToken?.stateHistory) {
        response.leverageToken.stateHistory.push(...result.data.leverageToken.stateHistory);
      }

      const stateHistoryLength = result.data.leverageToken?.stateHistory?.length || 0;
      if (stateHistoryLength < 1000) {
        break;
      } else {
        skip += 1000;
      }
    }

    return response;
  },
  ...queryConfig.platformDataQueryConfig,
});

export async function fetchLeverageTokenValueHistorical(variables: { address: string }) {
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(fetchLeverageTokenValueHistoricalQueryOptions(variables));
  return data;
}
```

### 2. Collateral Price Historical Fetch

**File: `src/app/data/leverage-tokens/queries/collateral-price-historical/CollateralPriceHistorical.fetch.ts`**

```typescript
import { getLeverageTokenApolloClient } from "../../../../config/apollo-clients";
import {
  CollateralPriceHistoricalDocument,
  CollateralPriceHistoricalQuery,
  CollateralPriceHistoricalQueryVariables,
} from "../../../../../generated-graphql/leverage-token-index";
import { getQueryClient } from "../../../../contexts/CustomQueryClientProvider";
import { checkGraphQlResponse } from "../../../../v3/utils/utils";
import { queryConfig } from "../../../settings/queryConfig";
import { MAX_HISTORICAL_DATA_POINTS } from "../../../../../meta/constants";

export const fetchCollateralPriceHistoricalQueryOptions = (variables: { address: string }) => ({
  queryKey: ["fetchCollateralPriceHistorical", variables.address],
  queryFn: async () => {
    const client = getLeverageTokenApolloClient();

    // 1000 is the maximum number of items that can be returned by the subgraph. If there are more
    // items, we need to paginate.
    let response;
    let skip = 0;

    while (skip < MAX_HISTORICAL_DATA_POINTS) {
      const result = await client.query<CollateralPriceHistoricalQuery, CollateralPriceHistoricalQueryVariables>({
        query: CollateralPriceHistoricalDocument,
        variables: { address: variables.address, first: 1000, skip },
        fetchPolicy: "no-cache",
      });

      checkGraphQlResponse(result);

      if (skip === 0) {
        response = result.data;
      } else if (response?.leverageToken && result.data.leverageToken?.lendingAdapter?.oracle?.priceUpdates) {
        response.leverageToken.lendingAdapter.oracle.priceUpdates.push(
          ...result.data.leverageToken.lendingAdapter.oracle.priceUpdates
        );
      }

      const priceUpdatesLength = result.data.leverageToken?.lendingAdapter?.oracle?.priceUpdates?.length || 0;
      if (priceUpdatesLength < 1000) {
        break;
      } else {
        skip += 1000;
      }
    }

    return response;
  },
  ...queryConfig.platformDataQueryConfig,
});

export async function fetchCollateralPriceHistorical(variables: { address: string }) {
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(fetchCollateralPriceHistoricalQueryOptions(variables));
  return data;
}
```

### 3. User Leverage Token Profit Fetch

**File: `src/app/data/leverage-tokens/queries/leverage-token-profit/user-leverage-token-profit.fetch.ts`**

```typescript
import {
  UserLeverageTokenProfitDocument,
  UserLeverageTokenProfitQuery,
  UserLeverageTokenProfitQueryVariables,
} from "../../../../../generated-graphql/leverage-token-index";
import { getLeverageTokenApolloClient } from "../../../../config/apollo-clients";
import { getQueryClient } from "../../../../contexts/CustomQueryClientProvider";
import { queryConfig } from "../../../settings/queryConfig";
import { checkGraphQlResponse } from "../../../../v3/utils/utils";

export const fetchUserLeverageTokenProfitQueryOptions = (variables: { userId: string; leverageTokenId: string }) => ({
  queryKey: ["fetchUserLeverageTokenProfit", variables.userId, variables.leverageTokenId],
  queryFn: async () => {
    const client = getLeverageTokenApolloClient();
    const result = await client.query<UserLeverageTokenProfitQuery, UserLeverageTokenProfitQueryVariables>({
      query: UserLeverageTokenProfitDocument,
      variables: {
        userId: variables.userId,
        leverageTokenId: variables.leverageTokenId,
      },
      fetchPolicy: "no-cache",
    });

    checkGraphQlResponse(result);
    return result.data;
  },
  ...queryConfig.platformDataQueryConfig,
});

export async function fetchUserLeverageTokenProfit(variables: { userId: string; leverageTokenId: string }) {
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(fetchUserLeverageTokenProfitQueryOptions(variables));
  return data;
}
```

## Constants Configuration

### File: `src/meta/constants.ts`

```typescript
// Maximum number of historical data points to fetch (15,000)
export const MAX_HISTORICAL_DATA_POINTS = 15000;
```

## Utility Functions

### GraphQL Response Validation

**File: `src/app/v3/utils/utils.ts`**

```typescript
export const checkGraphQlResponse = (result: any) => {
  if (result.errors) {
    throw new Error(`GraphQL Query Failed: ${result.errors.map((e: any) => e.message).join("; ")}`);
  } else if (result.error) {
    throw new Error(`GraphQL Query Failed: ${result.error.message}`);
  }
};
```

## UI Components Implementation

### 1. Leverage Token Value Graph Component

**File: `src/app/v3/pages/leverage-token-details/components/graphs/LeverageTokenValueGraphComponent.tsx`**

```typescript
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Typography, useNotificationContext, formatUnits } from "@shared";
import { Address } from "viem";
import { GraphSpinner } from "../../../../components/graph/GraphSpinner";
import { formatDate } from "../../utils/formatDateForGraph";
import { LeverageTokenValueHistoricalQuery } from "../../../../../../generated-graphql/leverage-token-index";
import { fetchLeverageTokenValueHistorical } from "../../../../../data/leverage-tokens/queries/leverage-token-value-historical/LeverageTokenValueHistorical.fetch";
import { fetchToken } from "@shared";

export const LeverageTokenValueGraphComponent: React.FC<{
  tokenAddress?: Address;
}> = ({ tokenAddress }) => {
  const { showNotification } = useNotificationContext();

  const [isLoading, setIsLoading] = useState(false);
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [chartSeries, setChartSeries] = useState<{ name: string; data: number[] }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!tokenAddress) return;
      let result: LeverageTokenValueHistoricalQuery | undefined;
      let tokenData: any;

      try {
        setIsLoading(true);
        [result, tokenData] = await Promise.all([
          fetchLeverageTokenValueHistorical({ address: tokenAddress }),
          fetchToken(tokenAddress),
        ]);
        if (!result?.leverageToken) {
          throw new Error(`No stateHistory for address: ${tokenAddress}`);
        }
      } catch (error) {
        console.error("Error fetching LT value history:", error);
        showNotification({
          status: "error",
          content: <Typography>Error loading leverage token value.</Typography>,
        });
      } finally {
        setIsLoading(false);
      }

      if (!result?.leverageToken?.stateHistory || !tokenData) return;
      const rawPoints = result.leverageToken.stateHistory || [];

      const sorted = [...rawPoints].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

      const categories = sorted.map((pt) => {
        const tsNum = Number(pt.timestamp);
        const ms = tsNum / 1_000;
        return formatDate(new Date(ms), false, false);
      });

      const valueData = sorted.map((pt) => {
        return Number(formatUnits(pt.equityPerTokenInDebt, tokenData?.decimals));
      });

      setChartOptions({
        chart: {
          id: "lt-value-graph",
          type: "line",
          toolbar: { show: false },
          zoom: { enabled: true },
          animations: {
            enabled: true,
            speed: 2000,
            easing: "easeout",
          },
        },
        colors: ["#4F68F7"],
        dataLabels: { enabled: false },
        xaxis: {
          type: "category",
          categories,
          tickAmount: 5,
          labels: {
            rotate: 0,
            formatter: (value: string) => value,
          },
          tooltip: { enabled: true },
        },
        yaxis: {
          tickAmount: 4,
          labels: {
            formatter: (val: number) => `${val.toFixed(6)}`,
          },
        },
        tooltip: {
          x: {
            show: true,
            formatter: (index: number) => {
              const point = sorted[index - 1];
              if (!point) return "";
              return formatDate(new Date(Number(point.timestamp) / 1_000), true, true);
            },
          },
          cssClass: "custom-tooltip",
        },
        grid: {
          strokeDashArray: 4,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
        },
        stroke: { curve: "straight", width: 2.5 },
        legend: { show: false },
      });

      setChartSeries([
        {
          name: "Leverage Token Value",
          data: valueData,
        },
      ]);
    };

    loadData();
  }, [tokenAddress, showNotification]);

  return (
    <div className="flex flex-col w-full rounded-card bg-neutral-0 pt-2 gap-8">
      <Typography type="bold5">Leverage Token Value</Typography>

      <div className="relative">
        {isLoading && <GraphSpinner />}
        <Chart
          options={chartOptions}
          series={chartSeries}
          type={chartOptions.chart?.type || "line"}
          height="400"
          width="100%"
          className="mx-[-30px] md:mx-[-14px]"
        />
      </div>
    </div>
  );
};
```

### 2. Collateral Price Graph Component

**File: `src/app/v3/pages/leverage-token-details/components/graphs/CollateralPriceGraphComponent.tsx`**

```typescript
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { FlexCol, Typography, formatToDisplayable, useNotificationContext } from "@shared";
import { Address } from "viem";
import { GraphSpinner } from "../../../../components/graph/GraphSpinner";
import { formatDate } from "../../utils/formatDateForGraph";
import { CollateralPriceHistoricalQuery } from "../../../../../../generated-graphql/leverage-token-index";
import { fetchCollateralPriceHistorical } from "../../../../../data/leverage-tokens/queries/collateral-price-historical/CollateralPriceHistorical.fetch";

export const CollateralPriceGraphComponent: React.FC<{
  collateralAddress?: Address;
  collateralPriceLabel?: string;
}> = ({ collateralAddress, collateralPriceLabel }) => {
  const { showNotification } = useNotificationContext();

  const [isLoading, setIsLoading] = useState(false);
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [chartSeries, setChartSeries] = useState<{ name: string; data: number[] }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!collateralAddress) return;
      let result: CollateralPriceHistoricalQuery | undefined;

      try {
        setIsLoading(true);
        result = await fetchCollateralPriceHistorical({ address: collateralAddress });

        if (!result?.leverageToken) {
          throw new Error(`No data returned for address: ${collateralAddress}`);
        }
      } catch (error) {
        console.error("Error fetching collateral price history:", error);
        showNotification({
          status: "error",
          content: <Typography>Error loading collateral price history.</Typography>,
        });
      } finally {
        setIsLoading(false);
      }

      if (!result?.leverageToken?.lendingAdapter?.oracle) return;
      const { oracle } = result.leverageToken.lendingAdapter;
      const { decimals } = oracle;
      const rawPoints = oracle.priceUpdates || [];

      // Sort by timestamp ascending
      const sorted = [...rawPoints].sort((a, b) => a.timestamp - b.timestamp);

      // Build categories (formatted dates) and series data (price / 10^decimals)
      const categories = sorted.map((pt) => formatDate(new Date(pt.timestamp / 1000), false, false));
      const priceData = sorted.map((pt) => Number(pt.price) / 10 ** decimals);

      setChartOptions({
        chart: {
          id: "collateral-price-graph",
          type: "line",
          toolbar: { show: false },
          zoom: { enabled: true },
          animations: {
            enabled: true,
            speed: 2000,
            easing: "easeout",
          },
        },
        colors: ["#4F68F7"],
        dataLabels: { enabled: false },
        xaxis: {
          type: "category",
          categories,
          tickAmount: 5,
          labels: {
            rotate: 0,
            formatter: (value: string) => value,
          },
          tooltip: { enabled: true },
        },
        yaxis: {
          tickAmount: 4,
          labels: {
            formatter: (val: number) =>
              `${formatToDisplayable(val, {
                singleDigitNumberDecimals: 5,
              })}`,
          },
        },
        tooltip: {
          x: {
            show: true,
            formatter: (index: number) => {
              const point = sorted[index - 1];
              if (!point) return "";
              return formatDate(new Date(Number(point.timestamp) / 1_000), true, true);
            },
          },
          cssClass: "custom-tooltip",
        },
        grid: {
          strokeDashArray: 4,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
        },
        stroke: { curve: "straight", width: 2.5 },
        legend: { show: false },
      });

      setChartSeries([
        {
          name: `Collateral Price (${collateralPriceLabel})`,
          data: priceData,
        },
      ]);
    };

    loadData();
  }, [collateralAddress, showNotification]);

  return (
    <div className="flex flex-col w-full rounded-card bg-neutral-0 pt-2 gap-8">
      <Typography type="bold5">Collateral Price</Typography>

      <FlexCol>
        <div className="relative">
          {isLoading && <GraphSpinner />}
          <Chart
            options={chartOptions}
            series={chartSeries}
            type={chartOptions.chart?.type || "line"}
            height="400"
            width="100%"
            className="mx-[-30px] md:mx-[-14px]"
          />
        </div>
      </FlexCol>
    </div>
  );
};
```

## User Profit Calculation Implementation

### File: `src/app/data/leverage-tokens/queries/leverage-token-profit/unrealized-gain-loss.fetch.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { ONE_ETHER } from "../../../../../meta";
import {
  fetchToken,
  formatFetchBigIntToViewBigInt,
  formatFetchNumberToViewNumber,
  ViewBigInt,
  ViewNumber,
} from "../../../../../shared";
import { cValueInUsd } from "../../../common/math/cValueInUsd";
import { fetchAssetPriceInBlock } from "../../../common/queries/useFetchViewAssetPrice";
import { getConfig } from "../../../../utils/queryContractUtils";
import { fetchLeverageTokenAssets } from "../leverage-token-assets/leverage-token-assets.fetch";
import { fetchUserEquity } from "../user-equity/user-equity.fetch";
import { fetchUserLeverageTokenProfit } from "./user-leverage-token-profit.fetch";

export interface UserUnrealized {
  unrealizedCollateral: ViewBigInt;
  unrealizedUsd: ViewBigInt;
  unrealizedPercent: ViewNumber;
}

export async function fetchUserUnrealized(user: Address, leverageToken: Address): Promise<UserUnrealized> {
  const profitData = await fetchUserLeverageTokenProfit({
    userId: user.toLowerCase(),
    leverageTokenId: leverageToken.toLowerCase(),
  });
  const position = profitData.user?.positions?.[0];
  if (!position) {
    return {
      unrealizedCollateral: formatFetchBigIntToViewBigInt({
        bigIntValue: 0n,
        decimals: 0,
        symbol: "",
      }),
      unrealizedUsd: formatFetchBigIntToViewBigInt({
        bigIntValue: 0n,
        decimals: 0,
        symbol: "$",
      }),
      unrealizedPercent: formatFetchNumberToViewNumber({
        value: 0,
        symbol: "%",
      })
    };
  }

  const totalDepositedInCollateralBigInt = BigInt(position?.totalEquityDepositedInCollateral || 0n);

  const { collateralAsset } = await fetchLeverageTokenAssets(leverageToken);

  const { tokenAmount, dollarAmount } = await fetchUserEquity(user, leverageToken);
  const currentEquityCollateralBigInt = tokenAmount.bigIntValue;
  const currentEquityUsdBigInt = dollarAmount.bigIntValue;

  const [collateralPriceData, collateralTokenData] = await Promise.all([
    fetchAssetPriceInBlock(getConfig(), collateralAsset),
    fetchToken(collateralAsset),
  ]);
  const collateralPriceBigInt = collateralPriceData;
  const collateralDecimals = collateralTokenData.decimals;

  const depositUsdBigInt = cValueInUsd(totalDepositedInCollateralBigInt, collateralPriceBigInt, collateralDecimals);

  const unrealizedCollateralBigInt =
    currentEquityCollateralBigInt != null
      ? currentEquityCollateralBigInt - totalDepositedInCollateralBigInt
      : undefined;

  const unrealizedUsdBigInt =
    currentEquityUsdBigInt != null && depositUsdBigInt != null ? currentEquityUsdBigInt - depositUsdBigInt : undefined;

  // Format BigInt → ViewBigInt
  const unrealizedCollateralView = formatFetchBigIntToViewBigInt({
    bigIntValue: unrealizedCollateralBigInt,
    decimals: collateralDecimals,
    symbol: collateralTokenData.symbol,
  });
  const unrealizedUsdView = formatFetchBigIntToViewBigInt({
    bigIntValue: unrealizedUsdBigInt,
    decimals: dollarAmount.decimals,
    symbol: dollarAmount.symbol,
  });

  // Compute %: (unrealizedUsd / depositUsd) × 100
  let unrealizedPercent = formatFetchNumberToViewNumber({
    value: 0,
    symbol: "%",
  });

  if (unrealizedUsdBigInt && depositUsdBigInt && (depositUsdBigInt || 0n) > 0n) {
    const ratio = (unrealizedUsdBigInt * ONE_ETHER * 100n) / depositUsdBigInt;
    unrealizedPercent = formatFetchNumberToViewNumber({
      value: Number(formatUnits(ratio, 18)),
      symbol: "%",
    });
  }

  return {
    unrealizedCollateral: unrealizedCollateralView,
    unrealizedUsd: unrealizedUsdView,
    unrealizedPercent,
  };
}

export function useFetchUserUnrealized(leverageToken?: Address) {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["fetchUserUnrealized", address, leverageToken],
    queryFn: () => fetchUserUnrealized(address!, leverageToken!),
    enabled: !!address && !!leverageToken,
  });
}
```

## Key Implementation Patterns

### 1. Pagination Strategy
- **Batch Size**: 1000 records per request
- **Maximum Records**: 15,000 total records
- **Implementation**: While loop with skip increment
- **Data Merging**: Concatenate arrays from multiple requests

### 2. Error Handling
- **GraphQL Validation**: `checkGraphQlResponse()` function
- **User Notifications**: Error messages displayed to users
- **Console Logging**: Detailed error logging for debugging

### 3. Caching Strategy
- **Fetch Policy**: `"no-cache"` for real-time data
- **React Query**: Client-side caching with query keys
- **Query Config**: Platform data query configuration

### 4. Data Processing
- **Timestamp Sorting**: Ascending order for chronological display
- **Decimal Handling**: Proper decimal conversion for display
- **BigInt Operations**: Safe arithmetic operations for large numbers

## Dependencies

### Required Packages
```json
{
  "@apollo/client": "^3.x.x",
  "@tanstack/react-query": "^4.x.x",
  "apexcharts": "^3.x.x",
  "react-apexcharts": "^1.x.x",
  "viem": "^1.x.x",
  "wagmi": "^1.x.x"
}
```

### Code Generation
```bash
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

## Usage Examples

### 1. Fetching Historical Data
```typescript
// Fetch leverage token value history
const valueHistory = await fetchLeverageTokenValueHistorical({ 
  address: "0x123..." 
});

// Fetch collateral price history
const priceHistory = await fetchCollateralPriceHistorical({ 
  address: "0x456..." 
});
```

### 2. User Profit Calculation
```typescript
// Calculate user unrealized gains/losses
const unrealized = await fetchUserUnrealized(
  "0xuser...", 
  "0xtoken..."
);
```

### 3. React Hook Usage
```typescript
// Use in React components
const { data: unrealized, isLoading } = useFetchUserUnrealized(tokenAddress);
```

## File Structure Reference

```
src/
├── app/
│   ├── config/
│   │   └── apollo-clients.ts
│   ├── data/
│   │   └── leverage-tokens/
│   │       └── queries/
│   │           ├── leverage-token-value-historical/
│   │           │   ├── LeverageTokenValueHistorical.graphql
│   │           │   └── LeverageTokenValueHistorical.fetch.ts
│   │           ├── collateral-price-historical/
│   │           │   ├── CollateralPriceHistorical.graphql
│   │           │   └── CollateralPriceHistorical.fetch.ts
│   │           └── leverage-token-profit/
│   │               ├── user-leverage-token-profit.graphql
│   │               ├── user-leverage-token-profit.fetch.ts
│   │               └── unrealized-gain-loss.fetch.ts
│   └── v3/
│       └── pages/
│           └── leverage-token-details/
│               └── components/
│                   └── graphs/
│                       ├── LeverageTokenValueGraphComponent.tsx
│                       └── CollateralPriceGraphComponent.tsx
├── generated-graphql/
│   └── leverage-token-index.tsx
└── meta/
    └── constants.ts
```

This implementation provides a complete, production-ready solution for integrating leverage tokens subgraph functionality into any React application.
