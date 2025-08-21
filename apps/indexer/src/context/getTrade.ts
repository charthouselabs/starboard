import { BigDecimal } from "@subsquid/big-decimal";
import { StarboardContext } from "../main";
import { Market, OrderSide, Trade, TradeType } from "../model";
import { getMarket } from "./getMarket";

export type TradeCreationArgs = {
    createdAt?: Date;
    createdAtHeight?: number;
    side?: OrderSide;
    size?: BigDecimal;
    tradeType?: TradeType;
    marketId?: string;
    market?: Market;
}

export async function getTrade(tradeId: string, ctx: StarboardContext, args?: TradeCreationArgs) {
    // if trade is already in the store, return it
    let trade = await ctx.store.findOne(Trade, { where: { id: tradeId } });

    if (trade) {
        return trade;
    }

    // otherwise, create a default trade
    trade = new Trade();
    trade.id = tradeId;
    trade.createdAt = args?.createdAt ?? ctx.timestamp;
    trade.createdAtHeight = args?.createdAtHeight ?? ctx.block;
    trade.side = args?.side ?? OrderSide.BUY;
    trade.size = args?.size ?? BigDecimal(0);
    trade.tradeType = args?.tradeType ?? TradeType.Limit;
    trade.market = args?.market ?? (args?.marketId ? await getMarket(args.marketId, ctx) : new Market());

    // save the trade
    await ctx.store.upsert([trade]);

    return trade;
}

export type TradeKey = {
    indexAsset: string;
    collateralAsset: string;
    account: string;
    timestamp: number;
}
export function computeTradeId({ indexAsset, collateralAsset, account, timestamp }: TradeKey) {
    return `${indexAsset}-${collateralAsset}-${account}-${timestamp}`;
}
