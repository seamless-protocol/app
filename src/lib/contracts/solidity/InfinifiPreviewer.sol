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
}

interface IERC4626PreviewRedeem {
    function previewRedeem(uint256 shares) external view returns (uint256 assets);
}

/// @notice Chains mint/redeem preview calls for USDC/iUSD <-> siUSD flows in one RPC call.
/// @dev Intended for off-chain use to reduce round-trips when pricing deposits and redemptions.
contract InfinifiPreviewer {
    function previewDepositFromAsset(
        address mintController,
        address vault,
        uint256 assetAmount
    ) external view returns (uint256 receiptAmount, uint256 sharesOut) {
        receiptAmount = IInfinifiMintController(mintController).assetToReceipt(assetAmount);
        sharesOut = IERC4626PreviewDeposit(vault).previewDeposit(receiptAmount);
    }

    /// @notice Chains vault.previewRedeem and RedeemController.receiptToAsset to quote assets in one RPC call.
    /// @dev Intended for off-chain use to reduce round-trips when pricing siUSD -> asset redemptions.
    function previewRedeemToAsset(
        address redeemController,
        address vault,
        uint256 shareAmount
    ) external view returns (uint256 receiptAmount, uint256 assetAmount) {
        receiptAmount = IERC4626PreviewRedeem(vault).previewRedeem(shareAmount);
        assetAmount = IInfinifiRedeemController(redeemController).receiptToAsset(receiptAmount);
    }
}
