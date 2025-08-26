#!/bin/bash

# Fund test account with WETH for E2E testing
# This script uses cast commands to directly manipulate the WETH balance

TEST_ACCOUNT="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
WETH_ADDRESS="0x4200000000000000000000000000000000000006"
RPC_URL="http://127.0.0.1:8545"

echo "🔧 Funding test account with WETH..."

# Step 1: Calculate storage slot for the balance mapping
# WETH balances are stored in slot 0: mapping(address => uint256) balances
BALANCE_SLOT=$(cast index address $TEST_ACCOUNT 0)
echo "Balance slot: $BALANCE_SLOT"

# Step 2: Set WETH balance to 10 ETH (in wei)
WETH_AMOUNT="0x8AC7230489E80000" # 10 ETH in hex
echo "Setting WETH balance to 10 ETH..."

cast rpc anvil_setStorageAt $WETH_ADDRESS $BALANCE_SLOT $WETH_AMOUNT --rpc-url $RPC_URL

# Step 3: Verify the balance
echo "Verifying WETH balance..."
BALANCE=$(cast call $WETH_ADDRESS "balanceOf(address)(uint256)" $TEST_ACCOUNT --rpc-url $RPC_URL)
echo "Test account WETH balance: $BALANCE"

if [ "$BALANCE" != "0" ]; then
    echo "✅ Test account successfully funded with WETH!"
    exit 0
else
    echo "❌ Failed to fund test account with WETH"
    exit 1
fi