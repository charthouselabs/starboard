import { run } from '@subsquid/batch-processor'
import { augmentBlock } from '@subsquid/fuel-objects'
import { DataSourceBuilder } from '@subsquid/fuel-stream'
import { Store, TypeormDatabase } from '@subsquid/typeorm-store'
import { decodeLog } from './abis'
import { TradeCreationArgs, getTrade } from './context/getTrade'
import { handleIncreasePositionEvent } from './handlers'
import { IncreasePositionEvent } from './handlers/increasePosition'
import { Account, Asset, Candle, Contract, Market, Payment, Position, PriceTick, Trade } from './model'


const SUBSQUID_NETWORK_GATEWAY_URL_MAINNET = 'https://v2.archive.subsquid.io/network/fuel-mainnet'
const SUBSQUID_NETWORK_GATEWAY_URL_TESTNET = 'https://v2.archive.subsquid.io/network/fuel-testnet'
const MAINNET_URL = 'https://mainnet.fuel.network/v1/graphql'
const TESTNET_URL = 'https://testnet.fuel.network/v1/graphql'
const LOCAL_NODE_URL = 'http://localhost:4000/v1/graphql'
const CONTRACTS = {
    VAULT: {
        ADDRESS: {
            MAINNET: "0x8002f2e86302ef9421558d0ae25a68cdfdbec5d27915cc2db49eded220799ecc",
            TESTNET: "0x4a0ba139fbea5af20369bd22bc83c5a9f23484193e56124c57e6f9bd1e7605fd",
        }
    }
}

const dataSource = new DataSourceBuilder()
    .setGateway(SUBSQUID_NETWORK_GATEWAY_URL_TESTNET)
    // .setGateway(SUBSQUID_NETWORK_GATEWAY_URL_MAINNET)
    .setGraphql({
        // url: MAINNET_URL,
        url: TESTNET_URL,
        // url: LOCAL_NODE_URL,
        strideConcurrency: 3,
        strideSize: 30
    })
    // Block data returned by the data source has the following structure:
    //
    // interface Block {
    //     header: BlockHeader
    //     receipts: Receipt[]
    //     transactions: Transaction[]
    //     inputs: Input[]
    //     outputs: Output[]
    // }
    //
    // For each block item we can specify a set of fields
    //  we want to fetch via the `.setFields()` method.
    // Think about it as of an SQL projection.
    //
    // Accurate selection of only the required fields
    // can have a notable positive impact on performance
    // when the data is sourced from Subsquid Network.
    //
    // We do it below only for illustration as all fields we've
    // selected are fetched by default.
    // Override default selection by setting flags for undesirable fields to `false`.
    .setFields({
        receipt: {
            contract: true,
            receiptType: true,
            data: true,
            rb: true,
            assetId: true,
            subId: true,
            amount: true,
        }
    })
    // Eequest items via `.addXxx()` methods that accept item selection criteria
    // & allow to request related items.
    .addReceipt({
        type: ['LOG_DATA', 'MINT'],
        // contract: [CONTRACTS.VAULT.ADDRESS.MAINNET],
        transaction: true,
    })
    .build()

// for await (let batch of dataSource.getBlockStream()) {
//     for (let block of batch) {
//         console.log(block)
//     }
// }

// async function processBlocks() {
//   for await (const batch of dataSource.getBlockStream()) {
//     for (const block of batch) {
//       console.log(block);
//     }
//   }
// }
// processBlocks()

// Subsquid SDK can help transform & persist the data.
// Data processing in Subsquid SDK is defined by four components:
//  1. Data source (such as we've created above)
//  2. Database, responsible for persisting the work progress (last processed block) & for providing storage API to data handler.
//  3. Data handler, user defined function which accepts consecutive block batches, storage API and is responsible for entire data transformation.
//  4. Processor, connects and executes above three components.

// `TypeormDatabase` provides restricted subset of [TypeORM EntityManager API](https://typeorm.io/working-with-entity-manager)
// as a persistent storage interface & works with any Postgres-compatible database.
//
// Note, we don't pass any database connection parameters.
// That's because `TypeormDatabase` expects a certain project structure
// and environment variables to pick everything it needs by convention.
// Companion `@subsquid/typeorm-migration` tool works in the same way.
//
// For full configuration details please consult
// https://github.com/subsquid/squid-sdk/blob/278195bd5a5ed0a9e24bfb99ee7bbb86ff94ccb3/typeorm/typeorm-config/src/config.ts#L21
const database = new TypeormDatabase()

export type Context = {
    getPosition(positionId: string, ctx: StarboardContext): Promise<Position>;
    getTrade(tradeId: string, ctx: StarboardContext, args?: TradeCreationArgs): Promise<Trade>;
    getPayment(paymentId: string, ctx: StarboardContext): Promise<Payment>;
    getMarket(marketId: string, ctx: StarboardContext): Promise<Market>;
    getAsset(assetId: string, ctx: StarboardContext): Promise<Asset>;
    getAccount(accountId: string, ctx: StarboardContext): Promise<Account>;
    getCandle(candleId: string, ctx: StarboardContext): Promise<Candle>;
    getPriceTick(priceTickId: string, ctx: StarboardContext): Promise<PriceTick>;
    tx: string;
    block: number;
    index: number;
    timestamp: Date;
}

export type StarboardContext = Context & {
    store: Store;
}

run(dataSource, database, async ctx => {

    // `augmentBlock()` function from `@subsquid/fuel-objects` to enrich block items with references to related objects
    let blocks = ctx.blocks.map(augmentBlock) // `ctx.blocks` items are flat JS objects

    // let positions: Map<String, Position> = new Map()
    // let trades: Map<String, Trade> = new Map()
    // let payment: Map<String, Payment> = new Map()
    // let market: Map<String, Market> = new Map()
    // let assets: Map<String, Asset> = new Map()
    let contracts: Map<String, Contract> = new Map()
    // let account: Map<String, Account> = new Map()

    const starboardCtx: StarboardContext = {
        getTrade,
        getMarket: (marketId: string, ctx: StarboardContext) => Promise.resolve(new Market()),
        getAsset: (assetId: string, ctx: StarboardContext) => Promise.resolve(new Asset()),
        getAccount: (accountId: string, ctx: StarboardContext) => Promise.resolve(new Account()),
        getCandle: (candleId: string, ctx: StarboardContext) => Promise.resolve(new Candle()),
        getPriceTick: (priceTickId: string, ctx: StarboardContext) => Promise.resolve(new PriceTick()),
        getPayment: (paymentId: string, ctx: StarboardContext) => Promise.resolve(new Payment()),
        getPosition: (positionId: string, ctx: StarboardContext) => Promise.resolve(new Position()),
        block: 0,
        index: 0,
        timestamp: new Date(),
        tx: '',
        store: ctx.store,
    }

    for (let block of blocks) {
        for (let receipt of block.receipts) {
            let index = 0;
            let blockCtx = {
                ...starboardCtx,
                block: block.header.height,
                index: index++,
                timestamp: new Date(Number(block.header.time)),
                tx: block.header.hash,
            }
            if (receipt.receiptType == 'LOG_DATA' && receipt.contract != null) {
                const log = decodeLog(receipt.rb!.toString(), receipt.data!, receipt.transaction!.hash);

                switch (log?.name) {
                    case 'struct events::IncreasePosition':
                        handleIncreasePositionEvent(log.data as IncreasePositionEvent, blockCtx);
                        break;
                }
            }
        }
    }

    ctx.store.upsert([...contracts.values()])
})
