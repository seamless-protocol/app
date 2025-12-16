// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IInfinifiMintController {
    function assetToReceipt(uint256 assetAmount) external view returns (uint256);
}

interface IInfinifiRedeemController {
    function receiptToAsset(uint256 receiptAmount) external view returns (uint256);
}

interface IERC4626PreviewDeposit {
    function previewDeposit(uint256 assets) external view returns (uint256 shares);
    function yieldSharing() external view returns (address);
    function totalSupply() external view returns (uint256);
    function totalAssets() external view returns (uint256);
}

interface IYieldSharing {
    function vested() external view returns (uint256);
}

interface IERC4626PreviewRedeem {
    function previewRedeem(uint256 shares) external view returns (uint256 assets);
}

interface IUnstakeAndRedeemHelper {
    function siUSD2iUSD(uint256 siUSDAmount) external view returns (uint256 iUSDAmount);
    function siUSD2USDC(uint256 siUSDAmount) external view returns (uint256 usdcAmount);
}

/// @notice Chains mint/redeem preview calls for USDC/iUSD <-> siUSD flows in one RPC call.
/// @dev Intended for off-chain use to reduce round-trips when pricing deposits and redemptions.
contract InfinifiPreviewer {

    /// @notice Chains mint controller.assetToReceipt and _convertToShares to quote shares in one RPC call.
    /// @dev Intended for off-chain use to reduce round-trips when pricing asset -> siUSD deposits.
    function previewDepositFromAsset(
        address mintController,
        address vault,
        uint256 assetAmount
    ) external view returns (uint256 receiptAmount, uint256 sharesOut) {
        receiptAmount = IInfinifiMintController(mintController).assetToReceipt(assetAmount);
        sharesOut = _convertToShares(IERC4626PreviewDeposit(vault), receiptAmount);
    }

    /// @notice UnstakeAndRedeemHelper.siUSD2iUSD and UnstakeAndRedeemHelper.siUSD2USDC to quote iUSD and USDC amounts in one RPC call.
    /// @dev Intended for off-chain use to reduce round-trips when pricing siUSD -> asset redemptions.
    function previewRedeemToAsset(
        address unstakeAndRedeemHelper,
        uint256 siUSDAmount
    ) external view returns (uint256 iUSDAmount, uint256 assetAmount) {
        iUSDAmount = IUnstakeAndRedeemHelper(unstakeAndRedeemHelper).siUSD2iUSD(siUSDAmount);
        assetAmount = IUnstakeAndRedeemHelper(unstakeAndRedeemHelper).siUSD2USDC(siUSDAmount);
    }

    function _convertToShares(IERC4626PreviewDeposit vault, uint256 assetAmount) internal view returns (uint256 /* _sharesOut */ ) {
        address yieldSharing = vault.yieldSharing();
        uint256 vested = IYieldSharing(yieldSharing).vested();
        uint256 supply = vault.totalSupply();
        uint256 assets = vault.totalAssets() + vested;
        return supply == 0 ? assetAmount : ((assetAmount * supply) / assets);
    }
}
