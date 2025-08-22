// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    VaultAlreadyInitialized: (),
    VaultInvalidRUSDAsset: (),
    VaultForbiddenNotGov: (),
    VaultForbiddenNotManager: (),
    VaultInvalidMsgCaller: (Identity),

    VaultSizeExceeded: (),
    VaultCollateralExceeded: (),

    VaultInsufficientCollateralForFees: (),

    VaultPoolAmountLtBuffer: (),
    VaultCollateralShouldBeWithdrawn: (),
    VaultSizeMustBeMoreThanCollateral: (),

    VaultCannotBeLiquidated: (),

    VaultInvalidFundingRateFactor: (),
    VaultInvalidStableFundingRateFactor: (),

    VaultAssetNotWhitelisted: (),
    VaultInvalidAssetAmount: (),
    VaultInvalidRedemptionAmount: (),

    VaultInvalidPosition: (),
    VaultInvalidAmountIn: (),
    VaultInvalidAmountOut: (),
    VaultInvalidPositionSize: (),
    VaultInvalidLiquidator: (),

    VaultInvalidLiquidationFeeUsd: (),
    VaultInvalidFeeBasisPoints: (),

    VaultEmptyPosition: (),

    VaultAssetInNotWhitelisted: (),
    VaultAssetOutNotWhitelisted: (),
    VaultAssetsAreEqual: (),
    
    VaultLongCollateralIndexAssetsMismatch: (),
    VaultLongCollateralAssetMustNotBeStableAsset: (),

    VaultShortCollateralAssetMustBeStableAsset: (),
    VaultShortIndexAssetMustNotBeStableAsset: (),
    VaultShortIndexAssetNotShortable: (),

    VaultInvalidMintAmountGtU64Max: (),
    VaultInvalidRUSDBurnAmountGtU64Max: (),

    VaultDecimalsAreZero: (),
    VaultPriceQueriedIsZero: (),

    VaultReceiverCannotBeZero: (),

    VaultInvalidRusdAmount: (),

    VaultInvalidAssetForwarded: (),

    VaultMaxRusdExceeded: (u256),
    VaultMaxShortsExceeded: (),
    VaultMaxLeverageExceeded: (),
    VaultPoolAmountExceeded: (),

    VaultReserveExceedsPool: (),
    VaultInvalidIncrease: (),
    VaultInsufficientReserve: (),

    VaultAccountCannotBeZero: (),
    VaultCollateralAssetNotWhitelisted: (),

    VaultInvalidAveragePrice: (),
    VaultLossesExceedCollateral: (),
    VaultFeesExceedCollateral: (),
    VaultLiquidationFeesExceedCollateral: (),
}
