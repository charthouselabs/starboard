import { Provider, Wallet } from "fuels";
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "./account";
import { toAsset, getAssetId } from "./asset";
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID } from "./mock-pyth";
import { call, deploy } from "./utils";
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

  console.log('Deploying BNB...');
  const BNB = await deploy('Fungible', deployer);
  console.log('BNB deployed:', BNB.id);

  console.log('Deploying DAI...');
  const DAI = await deploy('Fungible', deployer);
  console.log('DAI deployed:', DAI.id);

  console.log('Deploying BTC...');
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

  const attachedContracts = [vault, vaultPricefeed, rusd];

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
      [toAsset(BNB)]
    )
  );

  console.log('Minting BNB...');
  await call(BNB.functions.mint(contrToIdentity(timeDistributor), 5000));
  console.log('Setting yield trackers...');
  await call(rusd.functions.set_yield_trackers([toContract(yieldTracker)]));

  console.log('Initializing VaultPricefeed...');
  await call(vaultPricefeed.functions.initialize(addrToIdentity(deployer), toAddress(deployer)));
  console.log('Setting asset configs...');
  console.log('BNB asset:', toAsset(BNB));
  console.log('BNB_PRICEFEED_ID:', BNB_PRICEFEED_ID);
  console.log('DAI asset:', toAsset(DAI));
  console.log('DAI_PRICEFEED_ID:', DAI_PRICEFEED_ID);
  console.log('BTC asset:', toAsset(BTC));
  console.log('BTC_PRICEFEED_ID:', BTC_PRICEFEED_ID);

  await call(vaultPricefeed.functions.set_asset_config(toAsset(BNB), BNB_PRICEFEED_ID, 9));
  await call(vaultPricefeed.functions.set_asset_config(toAsset(DAI), DAI_PRICEFEED_ID, 9));
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

  console.log('Adding liquidity...');
  console.log([rlp, rlpManager]);

  await call(rlpManager.functions.add_liquidity(
    toAsset(USDC),
    100_000_000_000,
    0,
    0,
  ).addContracts([rlp]).callParams({
    forward: [100_000_000_000, getAssetId(USDC)],
  }))

  console.log('Deployment and initialization complete!');
}
