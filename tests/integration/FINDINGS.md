# Integration Testing Findings

## Issue Discovered: Frontend Architecture Mismatch  

### Summary  
Integration tests revealed a **frontend architecture issue**: the UI incorrectly attempts to mint tokens directly, but the production contracts use a manager-based architecture where users interact with the manager contract.

### Investigation Results

#### Wrong Address in Config
- **Issue**: `src/lib/contracts/addresses.ts` uses implementation address (`leverageTokenImpl`)
- **Was using**: `0x057A2a1CC13A9Af430976af912A27A05DE537673` (implementation)
- **Should use**: `0xa2fceeae99d2caeee978da27be2d95b0381dbb8c` (deployed proxy)

#### Architecture Findings
- **Implementation Contract**: `0x057A2a1CC13A9Af430976af912A27A05DE537673`
  - Owner: `0x0000000000000000000000000000000000000000` (zero address)
  - Name/Symbol: Empty (uninitialized)
  - Status: Not usable

- **Deployed Proxy**: `0xa2fceeae99d2caeee978da27be2d95b0381dbb8c`
  - Name: "weETH / WETH 17x Leverage Token" 
  - Symbol: "WEETH-WETH-17x"
  - Owner: `0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8` (manager contract)
  - Status: ✅ Properly initialized

### Frontend Issues to Fix

#### 1. Wrong Contract Address
**File**: `src/lib/contracts/addresses.ts:61`
```typescript
// WRONG - using implementation
leverageTokenImpl: '0x057A2a1CC13A9Af430976af912A27A05DE537673'

// NEEDS - deployed proxies from factory events  
leverageTokens: [...] // Query factory for deployed tokens
```

#### 2. Frontend Architecture Issue  
**Problem**: Frontend incorrectly attempts direct token minting instead of using manager contract
```typescript
// FRONTEND APPROACH (WRONG)
const { request } = await simulateContract(config, {
  address: token,        // ❌ This fails with OwnableUnauthorizedAccount
  abi: leverageTokenAbi,
  functionName: 'mint',  // ❌ Only manager can call this
  args: [owner, amount],
  account: owner,
})

// EXPECTED APPROACH (CORRECT)  
const { request } = await simulateContract(config, {
  address: managerContract,  // ✅ Call manager contract instead
  abi: managerAbi,
  functionName: 'deposit', // ✅ Or whatever the user-facing function is
  args: [amount],
  account: owner,
})
```

**Root Cause**: Need to determine correct manager contract function for user minting

### Required Actions

#### 🔴 CRITICAL - Fix Frontend Architecture
1. **Determine correct manager contract function** for user minting/depositing
2. **Update `useMintToken` hook** to call manager contract instead of token directly
3. **Add manager contract ABI** to the codebase

#### 🟡 MEDIUM - Update Frontend Config  
4. **Update contract addresses** to use deployed proxies instead of implementation
5. **Add factory query** to discover all deployed leverage tokens dynamically

#### 🟢 LOW - Testing
6. **Update integration tests** to test correct manager contract flow
7. **Verify frontend functionality** works with manager-based architecture

### Integration Test Status
- ✅ **Environment**: Properly configured with Tenderly VNet
- ✅ **Contract Discovery**: Successfully found deployed proxy addresses  
- ✅ **Issue Identification**: Confirmed ownership configuration problem
- ✅ **Current Scope**: Integration testing harness complete and functional

### Future Enhancements (Post-Fix)
- 🔮 **After ownership fix**: Update tests to verify successful public minting  
- 🔮 **Optional**: Add manager contract ABI for alternative minting flow testing

### Contract Discovery Method
```typescript
// To find deployed leverage tokens:
const logs = await publicClient.getLogs({
  address: factoryAddress,
  event: BeaconProxyCreated,
  fromBlock: 0n,
})
```