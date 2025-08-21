import { createConfig } from 'fuels';

export default createConfig({
  workspace: './',
  output: './apps/indexer/types',
  snapshotDir: './chain-config',
  forcBuildFlags: ['--release'],
  autoStartFuelCore: true,
  onDev: (config) => {
    console.log('fuels:onDev', { config });
  },
});
/**
 * Check the docs:
 * https://docs.fuel.network/docs/fuels-ts/fuels-cli/config-file/
 */
