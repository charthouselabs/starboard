import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';
import { IndexerWebsocket } from './lib/indexerWebsocket';

// Simplified fake data types focused on basic balance information
export interface FakeChildSubaccountData {
    address: string;
    subaccountNumber: number;
    // Instead of equity/freeCollateral, we provide USDC balance that gets calculated into equity
    usdcBalance: string;
    // Standard required fields for ChildSubaccountData
    openPerpetualPositions: Record<string, never>;
    assetPositions: {
        USDC: {
            symbol: 'USDC';
            side: IndexerPositionSide.LONG;
            size: string; // This is the USDC balance
            assetId: '0';
            subaccountNumber: number;
        };
    };
}

export interface FakeParentSubaccountData {
    address: string;
    parentSubaccount: number;
    childSubaccounts: { [subaccountNumber: string]: FakeChildSubaccountData | undefined };
    live: {
        // Empty for now - just basic balance data
    };
}

/**
 * Fake update structure that matches IndexerWsParentSubaccountUpdateObject
 * This is what gets sent as WebSocket updates and requires blockHeight
 */
export interface FakeParentSubaccountUpdate {
    blockHeight: string;
    type: 'fake_injection';
    // Include the parent subaccount data in the update
    parentSubaccountData?: FakeParentSubaccountData;
}

/**
 * Inject a fake parent subaccount message into the websocket connection for client-side consumption
 * This simulates receiving a message from the server without actually sending to the server
 * @param websocket - The IndexerWebsocket instance
 * @param data - The fake parent subaccount data to inject
 * @param id - The ID for the channel (format: 'address/subaccountNumber')
 */
export function injectFakeParentSubaccountMessage(
    websocket: IndexerWebsocket,
    data: FakeParentSubaccountData,
    id: string
): void {
    // Create a proper update message with blockHeight
    const updateMessage: FakeParentSubaccountUpdate = {
        blockHeight: Date.now().toString(), // Use timestamp as fake block height
        type: 'fake_injection',
        parentSubaccountData: data,
    };
    websocket.injectFakeMessage('v4_parent_subaccounts', updateMessage, id);
}

/**
 * Inject fake parent subaccount balance data into the websocket connection
 * @param websocket - The IndexerWebsocket instance
 * @param data - The fake parent subaccount data to inject
 * @param address - The wallet address
 * @param subaccountNumber - The subaccount number
 */
export function injectFakeParentSubaccountBalance(
    websocket: IndexerWebsocket,
    data: FakeParentSubaccountData,
    address: string,
    subaccountNumber: number
): void {
    const id = `${address}/${subaccountNumber}`;
    injectFakeParentSubaccountMessage(websocket, data, id);
}

/**
 * Create a sample parent subaccount with basic balance data
 * @param address - The wallet address
 * @param subaccountNumber - The subaccount number
 * @param balanceData - Optional balance data to override defaults
 * @returns A properly formatted fake parent subaccount object
 */
export function createSampleParentSubaccount(
    address: string,
    subaccountNumber: number,
    balanceData?: {
        equity?: string;
        freeCollateral?: string;
    }
): FakeParentSubaccountData {
    // Use equity as USDC balance since without positions, equity = USDC balance
    const usdcBalance = balanceData?.equity ?? '10000.00';

    // Create a simple child subaccount with proper USDC asset position
    const childSubaccount: FakeChildSubaccountData = {
        address,
        subaccountNumber,
        usdcBalance,
        openPerpetualPositions: {},
        assetPositions: {
            USDC: {
                symbol: 'USDC',
                side: IndexerPositionSide.LONG,
                size: usdcBalance,
                assetId: '0',
                subaccountNumber,
            },
        },
    };

    return {
        address,
        parentSubaccount: subaccountNumber,
        childSubaccounts: {
            [subaccountNumber]: childSubaccount,
        },
        live: {},
    };
}

/**
 * Utility function to create a sample parent subaccount with random balance data
 * @param address - The wallet address
 * @param subaccountNumber - The subaccount number
 * @returns A fake parent subaccount with random balance data
 */
export function createRandomParentSubaccount(
    address: string,
    subaccountNumber: number
): FakeParentSubaccountData {
    // Generate random balance data for demo purposes
    const randomEquity = (Math.random() * 50000 + 1000).toFixed(2); // $1k - $51k

    return createSampleParentSubaccount(address, subaccountNumber, {
        equity: randomEquity,
        // Note: freeCollateral is ignored since it's calculated from USDC balance
    });
}
