// :PROPERTIES:
// :pub key: b256
// :pub account: Identity
// :pub collateral_asset: AssetId
// :pub index_asset: AssetId
// :pub collateral_delta: u256
// :pub size_delta: u256
// :pub is_long: bool
// :pub price: u256
// :pub fee: u256
// :END:

import { BigDecimal } from "@subsquid/big-decimal";
import { computeTradeId } from "../context/getTrade";
import { StarboardContext } from "../main";
import { OrderSide, TradeType } from "../model";

// - TODO Updates Position (new | increase)
//   - Position status = open
//   - side = is_long ? LONG : SHORT
//   - size = size_delta
//   - maxSize = ?constant?
//   - entryPrice = price | (calculate average entry price)
//   - exitPrice = null
//   - realized_pnl = 0 | (realized_pnl)
//   - createdAt = block.timestamp
//   - createdAtHeight = block.height
//   - sumOpen ?
//   - sumClose ?
//   - netFunding = 0 ??
//   - unrealizedPnl = 0 | (calculate)
//   - closeAt = null
//   - subaccountNumber = 0
//   - ticker = index_asset.ticker
//   - collateral = 0 | +=collateral_delta
//   - positionFees = ??? ;; is this needed
//   - lastIncreasedTime = block.timestamp
//   - account = Accounts.get_or_create(account)
//   - market = Market.get_by_index_asset(index_asset)

// - TODO Creates Trade
//   - createdatHeight = block.height
//   - createdAt = block.timestamp
//   - side = Buy
//   - size = size_delta
//   - tradeType = limit
//   - market = Market.get_by_index_asset(index_asset)
//   - position = new_position

export interface IncreasePositionEvent {
    key: string;
    account: string;
    collateral_asset: string;
    index_asset: string;
    collateral_delta: string;
    size_delta: string;
    is_long: boolean;
    price: string;
    fee: string;
}

export async function handleIncreasePositionEvent(log: IncreasePositionEvent, ctx: StarboardContext) {
    console.log("handling increase position event");
    // first compute the trade id
    // index_asset + collateral_asset + account + timestamp
    const tradeId = computeTradeId({
        indexAsset: log.index_asset,
        collateralAsset: log.collateral_asset,
        account: log.account,
        timestamp: ctx.block,
    });

    // get or create the trade
    const trade = await ctx.getTrade(tradeId, ctx,
        {
            createdAt: ctx.timestamp,
            createdAtHeight: ctx.block,
            side: log.is_long ? OrderSide.BUY : OrderSide.SELL,
            size: BigDecimal(log.size_delta),
            tradeType: TradeType.Limit,
            marketId: log.index_asset,
        }
    );

    // save trade
    await ctx.store.upsert([trade]);

    // todo: create position
    // todo: update market
}
