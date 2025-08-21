import { BigDecimal } from "@subsquid/big-decimal";
import { StarboardContext } from "../main";
import { Asset } from "../model";

// TODO: Move this to a constants file
const assetIdMap: Record<string, string> = {
    "FUEL": "",
    "USDC": "",
    "ETH": ""
}

export async function getAsset(assetId: string, ctx: StarboardContext) {
    let asset = await ctx.store.findOne(Asset, { where: { id: assetId } });

    if (asset) {
        return asset;
    }

    asset = new Asset();
    asset.id = assetId;
    asset.decimals = 0;
    asset.whitelisted = false;
    asset.stable = false;
    asset.shortable = false;
    asset.minProfitBasisPoints = 0;
    asset.weight = BigDecimal(0);
    asset.feedId = "";
    asset.price = BigDecimal(0);

    return asset;
}

export function computeAssetId(symbol: string) {
    return assetIdMap[symbol];
}
