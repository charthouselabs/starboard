import { PersistedState } from 'redux-persist';

import { FuelWalletConnection } from '../wallet';

type PersistAppStateV7 = PersistedState & {
    wallet: {
        sourceAccount: {
            address?: string;
            chain?: string;
            encryptedSignature?: string;
            walletInfo?: any;
        };
        localWallet?: {
            address?: string;
            subaccountNumber?: number;
        };
        localWalletNonce?: number;
        fuelWalletConnection?: FuelWalletConnection;
    };
};

/**
 * Adds fuelWalletConnection field to wallet slice for Fuel wallet persistence
 */
export function migration7(state: PersistedState | undefined): PersistAppStateV7 {
    if (!state) throw new Error('state must be defined');

    return {
        ...state,
        wallet: {
            ...(state as any).wallet,
            fuelWalletConnection: undefined,
        },
    };
}
