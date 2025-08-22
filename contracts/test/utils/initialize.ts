import { Provider, Wallet, WalletUnlocked } from "fuels";
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "./account";
import { getAssetId, toAsset } from "./asset";
import { BTC_PRICEFEED_ID, USDC_PRICEFEED_ID, getUpdatePriceDataCall } from "./mock-pyth";
import { toPrice, toUsd } from "./units";
import { call, deploy } from "./utils";
import { BTC_MAX_LEVERAGE, getBtcConfig } from "./vault";
import { WALLETS } from "./wallets";

export default async function initialize(provider: Provider) {

  const wallets = WALLETS.map((k) => Wallet.fromPrivateKey(k, provider));
  const [deployer, user0, user1, user2, user3] = wallets;
  const priceUpdateSigner = deployer;

  if (!deployer) {
    throw new Error('Deployer not a valid wallet');
  }

  console.log('Starting contract deployments...');

  /*
        NativeAsset + Pricefeed
    */
  console.log('Deploying USDC...')
  const USDC = await deploy('Fungible', deployer);
  console.log('USDC deployed:', USDC.id);

  console.log('Deploying BTC...')
  const BTC = await deploy('Fungible', deployer);
  console.log('BTC deployed:', BTC.id);

  /*
        Vault + Router + RUSD
    */
  console.log('Deploying Utils...');
  const utils = await deploy('Utils', deployer);
  console.log('Utils deployed:', utils.id);

  console.log('Deploying Vault...');
  const vault = await deploy('Vault', deployer);
  console.log('Vault deployed:', vault.id);

  console.log('Deploying VaultPricefeed...');
  const vaultPricefeed = await deploy('VaultPricefeed', deployer);
  console.log('VaultPricefeed deployed:', vaultPricefeed.id);

  console.log('Deploying Rusd...');
  const rusd = await deploy('Rusd', deployer);
  console.log('Rusd deployed:', rusd.id);

  console.log('Deploying TimeDistributor...');
  const timeDistributor = await deploy('TimeDistributor', deployer);
  console.log('TimeDistributor deployed:', timeDistributor.id);

  console.log('Deploying YieldTracker...');
  const yieldTracker = await deploy('YieldTracker', deployer);
  console.log('YieldTracker deployed:', yieldTracker.id);

  console.log('Deploying Rlp...');
  const rlp = await deploy('Rlp', deployer);
  console.log('Rlp deployed:', rlp.id);

  console.log('Deploying RlpManager...');
  const rlpManager = await deploy('RlpManager', deployer);
  console.log('RlpManager deployed:', rlpManager.id);

  console.log('Deploying ShortsTracker...');
  const shortsTracker = await deploy('ShortsTracker', deployer);
  console.log('ShortsTracker deployed:', shortsTracker.id);

  const attachedContracts = [vault, vaultPricefeed, rusd, rlp];

  const RUSD = getAssetId(rusd);
  const RLP = getAssetId(rlp);

  console.log('Initializing RUSD...');
  await call(rusd.functions.initialize(toContract(vault), toAddress(user0)));

  console.log('Initializing Vault...');
  await call(vault.functions.initialize(addrToIdentity(deployer), toAsset(rusd), toContract(rusd)));

  console.log('Setting vault pricefeed provider...');
  await call(vault.functions.set_pricefeed_provider(toContract(vaultPricefeed)));

  console.log('Initializing YieldTracker...');
  await call(yieldTracker.functions.initialize(toContract(rusd)));
  console.log('Setting yield tracker time distributor...');
  await call(yieldTracker.functions.set_time_distributor(toContract(timeDistributor)));
  console.log('Initializing TimeDistributor...');
  await call(timeDistributor.functions.initialize());
  console.log('Setting time distributor distribution...');
  await call(
    timeDistributor.functions.set_distribution(
      [contrToIdentity(yieldTracker)],
      [1000],
      [toAsset(USDC)]
    )
  );

  console.log('Setting yield trackers...');
  await call(rusd.functions.set_yield_trackers([toContract(yieldTracker)]));

  console.log('Minting USDC for time distributor...');
  await call(USDC.functions.mint(contrToIdentity(timeDistributor), 5000));

  console.log('Initializing VaultPricefeed...');
  await call(vaultPricefeed.functions.initialize(addrToIdentity(deployer), toAddress(priceUpdateSigner)));

  await call(vaultPricefeed.functions.set_asset_config(toAsset(USDC), USDC_PRICEFEED_ID, 9));
  await call(vaultPricefeed.functions.set_asset_config(toAsset(BTC), BTC_PRICEFEED_ID, 9));

  console.log('Setting funding rate...');
  await call(
    vault.functions.set_funding_rate(
      8 * 3600, // funding_interval (8 hours)
      600, // fundingRateFactor
      600 // stableFundingRateFactor
    )
  );

  console.log('Initializing RLP...');
  await call(rlp.functions.initialize());
  await call(rlp.functions.set_minter(addrToIdentity(rlpManager), true));

  console.log('Initializing ShortsTracker...');
  await call(shortsTracker.functions.initialize(toContract(vault)));

  console.log('Initializing RlpManager...');
  await call(rlpManager.functions.initialize(
    toContract(vault),
    toContract(rusd),
    toContract(rlp),
    toContract(shortsTracker),
    0 // cooldown_duration
  ));

  console.log('Setting RlpManager as manager in Vault...');
  await call(vault.functions.set_manager(toContract(rlpManager), true));

  console.log('Setting USDC asset configuration in Vault...');
  await call(vault.functions.set_asset_config(
    toAsset(USDC),
    6, // asset_decimals (USDC has 6 decimals)
    10000, // asset_weight (100% = 10000 basis points)
    0, // min_profit_bps
    100000000000000000000000000n, // max_rusd_amount (100 trillion in wei)
    true, // is_stable
    false // is_shortable
  ));

  console.log('Setting BTC asset configuration in Vault...');
  await call(vault.functions.set_asset_config(...getBtcConfig(BTC)));
  await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE));

  console.log('Minting USDC...');
  // minting some USDC for user0
  await call(USDC.functions.mint(addrToIdentity(deployer), 1_000_000_000_000))

  console.log('Minting BTC...');
  // minting some BTC for liquidity
  await call(BTC.functions.mint(addrToIdentity(deployer), 100_000_000_000)); // 100 BTC (with 9 decimals)

  console.log('Updating price usd data...');
  await call(getUpdatePriceDataCall(toAsset(USDC), toPrice(1), vaultPricefeed, priceUpdateSigner?.signer()!))
  await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner?.signer()!))

  console.log('Adding USDC liquidity...');
  await call(
    rlpManager
      .functions.add_liquidity(toAsset(USDC), 100_000_000_000, 100, 0)
      .addContracts(attachedContracts)
      .callParams({
        forward: [100_000_000_000, getAssetId(USDC), getAssetId(RLP)],
      })
  )


  // ok now let's seed some trades
  await seedTrades(wallets, vault, USDC, BTC, attachedContracts);

  console.log('Deployment and initialization complete!');
}

async function seedTrades(
  wallets: WalletUnlocked[],
  vault: any,
  USDC: any,
  BTC: any,
  attachedContracts: any[]
) {
  const [deployer, user0, user1, user2, user3] = wallets;

  // Helper function to sleep/wait
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Three different accounts, will create three different positions.
  // One will hold for 5 seconds, the next for a minute, and the last one will hold forever

  console.log('Seeding trades for three different accounts...');

  // First user: Will hold for 5 seconds then close
  console.log('User0: Creating long position (will hold for 5 seconds)...');
  await call(USDC.functions.mint(addrToIdentity(user0), 100_000_000)); // 100 USDC

  vault.account = user0;

  console.log('User0: Increasing position...', user0?.address.toB256());
  await call(
    vault
      .functions.increase_position(
        addrToIdentity(user0),
        toAsset(USDC),  // collateral asset
        toAsset(BTC),   // index asset  
        toUsd(50),      // size delta (50 USD)
        true            // is_long
      )
      .addContracts(attachedContracts)
      .callParams({
        forward: [100_000_000, getAssetId(USDC)], // forward USDC as collateral
      })
  );

  console.log('User0: Position created, waiting 5 seconds...');
  await sleep(5000);

  console.log('User0: Closing position after 5 seconds...');
  await call(
    vault
      .functions.decrease_position(
        addrToIdentity(user0),
        toAsset(USDC),
        toAsset(BTC),
        toUsd(50),      // size delta (close entire position)
        true,           // is_long
        addrToIdentity(user0) // receiver
      )
      .addContracts(attachedContracts)
  );

  vault.account = user1;
  // Second user: Will hold for 1 minute then close
  console.log('User1: Creating long position (will hold for 1 minute)...');
  await call(USDC.functions.mint(addrToIdentity(user1), 100_000_000)); // 100 USDC


  await call(
    vault
      .functions.increase_position(
        addrToIdentity(user1),
        toAsset(USDC),  // collateral asset
        toAsset(BTC),   // index asset
        toUsd(75),      // size delta (75 USD)
        true            // is_long
      )
      .addContracts(attachedContracts)
      .callParams({
        forward: [100_000_000, getAssetId(USDC)], // forward USDC as collateral
      })
  );

  console.log('User1: Position created, waiting 1 minute...');
  await sleep(60000); // 1 minute

  console.log('User1: Closing position after 1 minute...');
  await call(
    vault
      .functions.decrease_position(
        addrToIdentity(user1),
        toAsset(USDC),
        toAsset(BTC),
        toUsd(75),      // size delta (close entire position)
        true,           // is_long
        addrToIdentity(user1) // receiver
      )
      .addContracts(attachedContracts)
  );

  vault.account = user2;

  // Third user: Will hold forever (no close call)
  console.log('User2: Creating long position (will hold forever)...');
  await call(USDC.functions.mint(addrToIdentity(user2), 100_000_000)); // 100 USDC


  await call(
    vault
      .functions.increase_position(
        addrToIdentity(user2),
        toAsset(USDC),  // collateral asset
        toAsset(BTC),   // index asset
        toUsd(100),     // size delta (100 USD)
        true            // is_long
      )
      .addContracts(attachedContracts)
      .callParams({
        forward: [100_000_000, getAssetId(USDC)], // forward USDC as collateral
      })
  );

  console.log('User2: Position created, will hold forever');
  console.log('All trades seeded successfully!');
}
