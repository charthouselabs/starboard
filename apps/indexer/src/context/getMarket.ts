import { BigDecimal } from "@subsquid/big-decimal";
import { StarboardContext } from "../main";
import { Asset, Market, MarketStatus, MarketType } from "../model";

export async function getMarket(marketId: string, ctx: StarboardContext) {
    let market = await ctx.store.findOne(Market, { where: { id: marketId } });

    if (market) {
        return market;
    }

    market = new Market();
    market.id = marketId;

    market.indexAsset = new Asset();
    market.atomicResolution = -9;
    market.baseOpenInterest = "0";
    market.defaultFundingRate1H = BigDecimal(0);
    market.initialMarginFraction = BigDecimal(0);
    market.maintenanceMarginFraction = BigDecimal(0);
    market.marketType = MarketType.PERP;
    market.nextFundingRate = BigDecimal(0);
    market.openInterest = BigDecimal(0);
    market.openInterestLowerCap = BigDecimal(0);
    market.openInterestUpperCap = BigDecimal(0);
    market.oraclePrice = BigDecimal(0);
    market.priceChange24H = BigDecimal(0);
    market.quantumConversionExponent = -6;
    market.status = MarketStatus.Active;
    market.stepBaseQuantums = BigInt(1000000000);
    market.stepSize = BigDecimal(1);
    market.subticksPerTick = 100000;
    market.tickSize = BigDecimal(0.01);
    market.ticker = `${market.indexAsset.symbol}-USD`;
    market.trades24H = BigDecimal(0);
    market.volume24H = BigDecimal(0);
    market.clobPairId = 0;

    return market;
}

export function computeMarketId(indexAsset: string) {
    return `${indexAsset}`;
}