# Leverage Tokens Subgraph - Queries Reference

This document provides a comprehensive reference for all available queries in the Leverage Tokens subgraph. The subgraph indexes data from the Seamless Protocol's leverage token system, tracking leverage managers, tokens, positions, rebalances, and oracle data.

The main source code is in _data on the subgraph itself

## Table of Contents

1. [Core Entities](#core-entities)
2. [Query Examples](#query-examples)
3. [Data Relationships](#data-relationships)
4. [Time Series Data](#time-series-data)
5. [Integration Notes](#integration-notes)

## Core Entities

### 1. LeverageManager
The main contract that manages multiple leverage tokens.

**Key Fields:**
- `id`: Contract address
- `leverageTokens`: Array of managed leverage tokens
- `leverageTokensCount`: Total number of tokens
- `totalHolders`: Total unique holders across all tokens
- `assetStats`: Asset statistics by token

### 2. LeverageToken
Individual leverage tokens that represent leveraged positions.

**Key Fields:**
- `id`: Token contract address
- `leverageManager`: Reference to managing contract
- `lendingAdapter`: Lending protocol adapter (Morpho)
- `rebalanceAdapter`: Rebalancing mechanism
- `collateralRatio`: Current leverage ratio
- `totalCollateral`: Total collateral amount
- `totalSupply`: Total token supply
- `totalHolders`: Number of token holders
- `totalMintTokenActionFees`: Fees from minting
- `totalRedeemTokenActionFees`: Fees from redeeming
- `totalManagementFees`: Management fees collected
- `createdTimestamp`: Creation time
- `stateHistory`: Historical state snapshots
- `balanceChangeHistory`: Historical balance changes
- `rebalanceHistory`: Historical rebalances

### 3. Position
User positions in leverage tokens.

**Key Fields:**
- `id`: `{userAddress}-{leverageTokenAddress}`
- `user`: User address
- `leverageToken`: Leverage token reference
- `balance`: Token balance
- `totalEquityDepositedInCollateral`: Total equity deposited in collateral
- `totalEquityDepositedInDebt`: Total equity deposited in debt
- `balanceChangeHistory`: Historical balance changes

### 4. User
User accounts holding leverage token positions.

**Key Fields:**
- `id`: User address
- `positions`: Array of user positions

### 5. LendingAdapter
Adapters for lending protocols (currently Morpho).

**Key Fields:**
- `id`: Adapter contract address
- `type`: Adapter type (MORPHO)
- `morphoMarketId`: Morpho market ID
- `collateralAsset`: Collateral token address
- `debtAsset`: Debt token address
- `oracle`: Price oracle reference
- `leverageTokens`: Tokens using this adapter

### 6. Oracle
Price oracles for asset pricing.

**Key Fields:**
- `id`: Oracle contract address
- `leverageManager`: Managing leverage manager
- `type`: Oracle type (MORPHO_CHAINLINK)
- `price`: Current price
- `decimals`: Price decimals
- `morphoChainlinkOracleData`: Morpho-specific oracle data
- `priceUpdates`: Historical price updates
- `lendingAdapters`: Adapters using this oracle

### 7. Rebalance
Rebalancing events for leverage tokens.

**Key Fields:**
- `id`: Auto-incremented ID
- `leverageToken`: Token being rebalanced
- `actions`: Array of rebalance actions
- `collateralRatioBefore`: Ratio before rebalance
- `collateralRatioAfter`: Ratio after rebalance
- `equityInCollateralBefore`: Equity in collateral before
- `equityInCollateralAfter`: Equity in collateral after
- `equityInDebtBefore`: Equity in debt before
- `equityInDebtAfter`: Equity in debt after
- `dutchAuctionTake`: Dutch auction take reference (if applicable)
- `timestamp`: Rebalance timestamp
- `blockNumber`: Rebalance block number

### 8. RebalanceAction
Individual actions within a rebalance.

**Key Fields:**
- `id`: `{leverageToken}-{rebalanceIndex}-{actionIndex}`
- `type`: Action type (ADD_COLLATERAL, REMOVE_COLLATERAL, BORROW, REPAY)
- `amount`: Action amount
- `rebalance`: Parent rebalance reference

## Query Examples

### 1. Get All Leverage Tokens

```graphql
query GetAllLeverageTokens {
  leverageTokens {
    id
    leverageManager
    collateralRatio
    totalCollateral
    totalSupply
    totalHolders
    totalMintTokenActionFees
    totalRedeemTokenActionFees
    totalManagementFees
    createdTimestamp
    lendingAdapter {
      id
      type
      collateralAsset
      debtAsset
      oracle {
        id
        price
        decimals
      }
    }
  }
}
```

### 2. Get Leverage Token by Address

```graphql
query GetLeverageToken($tokenAddress: Bytes!) {
  leverageToken(id: $tokenAddress) {
    id
    leverageManager
    collateralRatio
    totalCollateral
    totalSupply
    totalHolders
    totalMintTokenActionFees
    totalRedeemTokenActionFees
    totalManagementFees
    createdTimestamp
    lendingAdapter {
      id
      type
      collateralAsset
      debtAsset
      oracle {
        id
        price
        decimals
      }
    }
    rebalanceAdapter {
      id
      dutchAuctionRebalanceAdapter {
        id
        maxDuration
        totalAuctions
        _currentAuction {
          id
          collateralRatioAtCreation
          timestamp
          timestampCompleted
        }
      }
    }
  }
}
```

### 3. Get User Positions

```graphql
query GetUserPositions($userAddress: Bytes!) {
  user(id: $userAddress) {
    id
    positions {
      id
      leverageToken {
        id
        collateralRatio
        totalCollateral
        totalSupply
        lendingAdapter {
          collateralAsset
          debtAsset
          oracle {
            price
            decimals
          }
        }
      }
      balance
      totalEquityDepositedInCollateral
      totalEquityDepositedInDebt
    }
  }
}
```

### 4. Get Position by User and Token

```graphql
query GetPosition($userAddress: Bytes!, $tokenAddress: Bytes!) {
  position(id: "${userAddress}-${tokenAddress}") {
    id
    user {
      id
    }
    leverageToken {
      id
      collateralRatio
      totalCollateral
      totalSupply
      lendingAdapter {
        collateralAsset
        debtAsset
        oracle {
          price
          decimals
        }
      }
    }
    balance
    totalEquityDepositedInCollateral
    totalEquityDepositedInDebt
  }
}
```

### 5. Get Leverage Token State History

```graphql
query GetLeverageTokenStateHistory($tokenAddress: Bytes!, $first: Int = 100, $skip: Int = 0) {
  leverageTokenStates(
    where: { leverageToken: $tokenAddress }
    orderBy: timestamp
    orderDirection: desc
    first: $first
    skip: $skip
  ) {
    id
    leverageToken
    collateralRatio
    totalCollateral
    totalDebt
    totalEquityInCollateral
    totalEquityInDebt
    totalSupply
    equityPerTokenInCollateral
    equityPerTokenInDebt
    timestamp
    blockNumber
  }
}
```

### 6. Get Balance Change History

```graphql
query GetBalanceChangeHistory($tokenAddress: Bytes!, $first: Int = 100, $skip: Int = 0) {
  leverageTokenBalanceChanges(
    where: { leverageToken: $tokenAddress }
    orderBy: timestamp
    orderDirection: desc
    first: $first
    skip: $skip
  ) {
    id
    leverageToken
    position {
      id
      user {
        id
      }
    }
    type
    amount
    amountDelta
    equityInCollateral
    equityInDebt
    equityDepositedInCollateral
    equityDepositedInDebt
    timestamp
    blockNumber
  }
}
```

### 7. Get Rebalance History

```graphql
query GetRebalanceHistory($tokenAddress: Bytes!, $first: Int = 100, $skip: Int = 0) {
  rebalances(
    where: { leverageToken: $tokenAddress }
    orderBy: timestamp
    orderDirection: desc
    first: $first
    skip: $skip
  ) {
    id
    leverageToken
    actions {
      id
      type
      amount
    }
    collateralRatioBefore
    collateralRatioAfter
    equityInCollateralBefore
    equityInCollateralAfter
    equityInDebtBefore
    equityInDebtAfter
    dutchAuctionTake {
      id
      priceMultiplier
      amountIn
      amountOut
      timestamp
    }
    timestamp
    blockNumber
  }
}
```

### 8. Get Oracle Price History

```graphql
query GetOraclePriceHistory($oracleAddress: Bytes!, $first: Int = 100, $skip: Int = 0) {
  oraclePrices(
    where: { oracle: $oracleAddress }
    orderBy: timestamp
    orderDirection: desc
    first: $first
    skip: $skip
  ) {
    id
    oracle
    price
    timestamp
  }
}
```

### 9. Get Dutch Auction Data

```graphql
query GetDutchAuctionData($rebalanceAdapterAddress: Bytes!) {
  rebalanceAdapter(id: $rebalanceAdapterAddress) {
    id
    dutchAuctionRebalanceAdapter {
      id
      maxDuration
      totalAuctions
      _currentAuction {
        id
        collateralRatioAtCreation
        timestamp
        timestampCompleted
        auctionTakeHistory {
          id
          priceMultiplier
          amountIn
          amountOut
          timestamp
        }
      }
      auctionHistory {
        id
        collateralRatioAtCreation
        timestamp
        timestampCompleted
        auctionTakeHistory {
          id
          priceMultiplier
          amountIn
          amountOut
          timestamp
        }
      }
    }
  }
}
```

### 10. Get Leverage Manager Statistics

```graphql
query GetLeverageManagerStats($managerAddress: Bytes!) {
  leverageManager(id: $managerAddress) {
    id
    leverageTokensCount
    totalHolders
    leverageTokens {
      id
      collateralRatio
      totalCollateral
      totalSupply
      totalHolders
      totalMintTokenActionFees
      totalRedeemTokenActionFees
      totalManagementFees
    }
    assetStats {
      id
      totalCollateral
    }
  }
}
```

### 11. Get Recent Activity (Multi-Entity)

```graphql
query GetRecentActivity($first: Int = 50) {
  leverageTokenBalanceChanges(
    orderBy: timestamp
    orderDirection: desc
    first: $first
  ) {
    id
    leverageToken
    position {
      id
      user {
        id
      }
    }
    type
    amountDelta
    equityInCollateral
    equityInDebt
    timestamp
    blockNumber
  }
  rebalances(
    orderBy: timestamp
    orderDirection: desc
    first: $first
  ) {
    id
    leverageToken
    collateralRatioBefore
    collateralRatioAfter
    timestamp
    blockNumber
  }
}
```

## Data Relationships

### Entity Relationships
```
LeverageManager
├── leverageTokens: [LeverageToken]
├── assetStats: [LeverageManagerAssetStats]
└── _oracles: [Oracle]

LeverageToken
├── leverageManager: LeverageManager
├── lendingAdapter: LendingAdapter
├── rebalanceAdapter: RebalanceAdapter
├── positions: [Position]
├── stateHistory: [LeverageTokenState]
├── balanceChangeHistory: [LeverageTokenBalanceChange]
└── rebalanceHistory: [Rebalance]

Position
├── user: User
├── leverageToken: LeverageToken
└── balanceChangeHistory: [LeverageTokenBalanceChange]

LendingAdapter
├── oracle: Oracle
└── leverageTokens: [LeverageToken]

Oracle
├── leverageManager: LeverageManager
├── morphoChainlinkOracleData: MorphoChainlinkOracleData
├── priceUpdates: [OraclePrice]
└── lendingAdapters: [LendingAdapter]

Rebalance
├── leverageToken: LeverageToken
├── actions: [RebalanceAction]
└── dutchAuctionTake: DutchAuctionRebalanceAdapterAuctionTake
```

## Time Series Data

The subgraph includes several time series entities for historical analysis:

### 1. LeverageTokenState
- Tracks state changes over time
- Includes collateral ratios, equity values, supply
- Updated on mints, redeems, and price changes

### 2. LeverageTokenBalanceChange
- Tracks all balance changes (mint, redeem, transfer)
- Includes equity calculations and deposited amounts
- Links to positions and leverage tokens

### 3. Rebalance
- Tracks rebalancing events
- Includes before/after states and actions
- Links to Dutch auction data when applicable

### 4. OraclePrice
- Tracks price updates from oracles
- Used for historical price analysis
- Links to oracle entities

### 5. DutchAuctionRebalanceAdapterAuctionTake
- Tracks Dutch auction takes
- Includes price multipliers and amounts
- Links to rebalances

## Integration Notes

### Query Optimization
- Use `first` and `skip` parameters for pagination
- Filter by specific addresses when possible
- Use `orderBy` and `orderDirection` for consistent ordering
- Consider using `where` clauses to filter results

### Data Types
- All addresses are `Bytes` type
- All amounts are `BigInt` type
- Timestamps are `Timestamp` type (Unix timestamp)
- Block numbers are `BigInt` type

### Error Handling
- Check for null values in nested queries
- Handle cases where entities might not exist
- Use optional chaining in your GraphQL queries

### Performance Considerations
- Time series queries can be expensive - use appropriate limits
- Consider caching frequently accessed data
- Use specific filters to reduce query scope
- Monitor query complexity and response times

### Common Use Cases
1. **Portfolio Tracking**: Query user positions and balance changes
2. **Token Analytics**: Get state history and rebalance data
3. **Price Monitoring**: Track oracle price updates
4. **Fee Analysis**: Aggregate fee data across tokens
5. **Rebalance Analysis**: Study rebalancing patterns and Dutch auctions

This subgraph provides comprehensive data for building analytics dashboards, portfolio trackers, and protocol monitoring tools for the Seamless Protocol leverage token system.
