import { useAccounts } from '@/hooks/useAccounts';
import { getSubaccountId } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';
import { useCallback } from 'react';
import { selectWebsocketUrl } from '../socketSelectors';
import { IndexerWebsocketManager } from './lib/indexerWebsocketManager';
import {
    createRandomParentSubaccount,
    createSampleParentSubaccount,
    injectFakeParentSubaccountBalance,
    type FakeParentSubaccountData,
} from './parentSubaccountFake';

/**
 * Hook that provides fake parent subaccount injection functionality
 * Useful for testing and demo purposes
 */
export function useFakeParentSubaccount() {
    const { address: rawAddress } = useAccounts();
    const subaccount = useAppSelector(getSubaccountId);
    const websocketUrl = useAppSelector(selectWebsocketUrl);

    // Also get address from Redux state as backup
    const walletState = useAppSelector((state) => state.wallet);
    const reduxAddress = walletState.sourceAccount?.address || walletState.localWallet?.address;

    // Use accounts hook address first, then Redux address, normalize to lowercase
    const address = (rawAddress || reduxAddress)?.toLowerCase();

    // Get the websocket instance from the websocket manager
    const websocket = websocketUrl ? IndexerWebsocketManager.use(websocketUrl) : null;

    const injectFakeBalance = useCallback(
        (balanceData?: { equity?: string; freeCollateral?: string }) => {
            if (!websocket || !address || subaccount == null) {
                return false;
            }

            try {
                const fakeData = createSampleParentSubaccount(address, subaccount, balanceData);
                injectFakeParentSubaccountBalance(websocket, fakeData, address, subaccount);
                return true;
            } catch (error) {
                return false;
            }
        },
        [websocket, address, subaccount]
    );

    const injectRandomBalance = useCallback(() => {
        if (!websocket || !address || subaccount == null) {
            return false;
        }

        try {
            const fakeData = createRandomParentSubaccount(address, subaccount);
            injectFakeParentSubaccountBalance(websocket, fakeData, address, subaccount);
            return true;
        } catch (error) {
            return false;
        }
    }, [websocket, address, subaccount]);

    const injectCustomData = useCallback(
        (customData: FakeParentSubaccountData) => {
            if (!websocket || !address || subaccount == null) {
                return false;
            }

            try {
                injectFakeParentSubaccountBalance(websocket, customData, address, subaccount);
                return true;
            } catch (error) {
                return false;
            }
        },
        [websocket, address, subaccount]
    );

    const seedAccount = useCallback(
        (seedType: 'starter' | 'medium' | 'large' = 'medium') => {
            if (!websocket || !address || subaccount == null) {
                console.warn('Cannot seed account: missing websocket, address, or subaccount');
                return false;
            }

            try {
                let balanceData: { equity: string; freeCollateral: string };

                switch (seedType) {
                    case 'starter':
                        balanceData = { equity: '10000.00', freeCollateral: '8000.00' };
                        break;
                    case 'medium':
                        balanceData = { equity: '50000.00', freeCollateral: '40000.00' };
                        break;
                    case 'large':
                        balanceData = { equity: '100000.00', freeCollateral: '80000.00' };
                        break;
                    default:
                        balanceData = { equity: '50000.00', freeCollateral: '40000.00' };
                }

                const fakeData = createSampleParentSubaccount(address, subaccount, balanceData);
                injectFakeParentSubaccountBalance(websocket, fakeData, address, subaccount);

                console.log(`🌱 Seeded account with ${seedType} balance:`, fakeData);
                return true;
            } catch (error) {
                console.error('Error seeding account:', error);
                return false;
            }
        },
        [websocket, address, subaccount]
    );

    return {
        // State
        canInject: Boolean(websocket && address && subaccount != null),
        address,
        subaccount,

        // Actions
        injectFakeBalance,
        injectRandomBalance,
        injectCustomData,
        seedAccount,
    };
}
