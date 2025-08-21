import { Provider } from 'fuels';

import initialize from '../contracts/test/utils/initialize';

// Wait function to allow the Fuel node time to start up
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('Waiting 5 seconds for Fuel node to start up...');
await wait(5000);
console.log('Fuel node startup wait complete. Proceeding with deployment...');

const provider = await new Provider('http://127.0.0.1:4000/v1/graphql');

await initialize(provider);
