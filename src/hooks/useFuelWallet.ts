import { FuelWalletConnector } from '@fuels/connectors';
import { Fuel } from 'fuels';
import { useCallback, useEffect, useState } from 'react';

import { OnboardingState } from '@/constants/account';
import { ConnectorType, WalletNetworkType, WalletType } from '@/constants/wallets';
import { setOnboardingState } from '@/state/account';
import { useAppDispatch } from '@/state/appTypes';
import { clearSourceAccount, setSourceAddress, setWalletInfo } from '@/state/wallet';

export interface FuelWalletInfo {
    connectorType: ConnectorType.Injected;
    name: WalletType.FuelWallet;
    icon: `data:image/${string}`;
    rdns: string;
}

export const useFuelWallet = () => {
    const dispatch = useAppDispatch();
    const [fuel, setFuel] = useState<Fuel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState<string | undefined>();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | undefined>();

    // Initialize Fuel instance
    useEffect(() => {
        console.log('Initializing Fuel instance...');
        const fuelInstance = new Fuel({
            connectors: [
                new FuelWalletConnector(),
            ],
        });
        console.log('Fuel instance created:', fuelInstance);
        setFuel(fuelInstance);
    }, []);

    // Check connection status on mount and when fuel changes
    useEffect(() => {
        if (!fuel) return;

        const checkConnection = async () => {
            try {
                console.log('Checking Fuel connection...');
                const connection = await fuel.currentConnector();
                console.log('Current connector:', connection);

                if (connection) {
                    const accounts = await fuel.accounts();
                    console.log('Fuel accounts:', accounts);

                    if (accounts && accounts.length > 0) {
                        const account = accounts[0] as any; // Type assertion to handle Fuel SDK type inference
                        console.log('First account:', account);

                        // Try different ways to get the address
                        let accountAddress = '';
                        if (typeof account === 'string') {
                            accountAddress = account;
                        } else if (account && typeof account === 'object' && 'address' in account) {
                            accountAddress = String(account.address);
                        } else {
                            console.log('Unknown account structure:', account);
                            return;
                        }

                        console.log('Account address:', accountAddress);
                        setIsConnected(true);
                        setAddress(accountAddress);

                        dispatch(setSourceAddress({
                            address: accountAddress,
                            chain: WalletNetworkType.Evm
                        }));

                        dispatch(setWalletInfo({
                            connectorType: ConnectorType.Injected,
                            name: WalletType.FuelWallet,
                            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwRkY4OCIvPgo8cGF0aCBkPSJNOCAxMkM4IDEwLjg5NTQgOC44OTU0MyAxMCAxMCAxMEgyMkMyMy4xMDQ2IDEwIDI0IDEwLjg5NTQgMjQgMTJWMjBDMjQgMjEuMTA0NiAyMy4xMDQ2IDIyIDIyIDIySDEwQzguODk1NDMgMjIgOCAyMS4xMDQ2IDggMjBWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQgMTZDMjQgMTQuODk1NCAyMy4xMDQ2IDE0IDIyIDE0SDI2QzI3LjEwNDYgMTQgMjggMTQuODk1NCAyOCAxNlYxNkMyOCAxNy4xMDQ2IDI3LjEwNDYgMTggMjYgMThIMjJDMjMuMTA0NiAxOCAyNCAxNy4xMDQ2IDI0IDE2WiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMiIgZmlsbD0iIzAwRkY4OCIvPgo8L3N2Zz4K',
                            rdns: 'fuel-wallet',
                        } as FuelWalletInfo));

                        // For Fuel wallet, skip key derivation and go directly to AccountConnected
                        console.log('Setting onboarding state to AccountConnected for Fuel wallet');
                        dispatch(setOnboardingState(OnboardingState.AccountConnected));
                        console.log('Onboarding state set to AccountConnected');
                    } else {
                        console.log('No Fuel accounts found, disconnecting...');
                        setIsConnected(false);
                        setAddress(undefined);
                        // Reset onboarding state when no accounts
                        dispatch(setOnboardingState(OnboardingState.Disconnected));
                    }
                } else {
                    console.log('No Fuel connector, disconnecting...');
                    setIsConnected(false);
                    setAddress(undefined);
                    // Reset onboarding state when no connector
                    dispatch(setOnboardingState(OnboardingState.Disconnected));
                }
            } catch (err) {
                console.error('Error checking Fuel connection:', err);
                setIsConnected(false);
                setAddress(undefined);
                // Reset onboarding state on error
                dispatch(setOnboardingState(OnboardingState.Disconnected));
            }
        };

        checkConnection();
    }, [fuel, dispatch]);

    const connect = useCallback(async () => {
        if (!fuel) {
            setError('Fuel not initialized');
            return;
        }

        try {
            console.log('Connecting to Fuel wallet...');
            setIsConnecting(true);
            setError(undefined);

            // Select the Fuel Wallet connector
            console.log('Available connectors:', fuel.connectors);
            await fuel.selectConnector('Fuel Wallet');

            // Connect to the wallet
            console.log('Calling fuel.connect()...');
            const connection = await fuel.connect();
            console.log('Connection result:', connection);

            if (connection) {
                const accounts = await fuel.accounts();
                console.log('Accounts after connection:', accounts);

                if (accounts && accounts.length > 0) {
                    const account = accounts[0] as any; // Type assertion to handle Fuel SDK type inference
                    console.log('First account after connection:', account);

                    // Try different ways to get the address
                    let accountAddress = '';
                    if (typeof account === 'string') {
                        accountAddress = account;
                    } else if (account && typeof account === 'object' && 'address' in account) {
                        accountAddress = String(account.address);
                    } else {
                        console.log('Unknown account structure after connection:', account);
                        setError('Could not get account address');
                        return;
                    }

                    console.log('Account address after connection:', accountAddress);
                    setIsConnected(true);
                    setAddress(accountAddress);

                    dispatch(setSourceAddress({
                        address: accountAddress,
                        chain: WalletNetworkType.Evm
                    }));

                    dispatch(setWalletInfo({
                        connectorType: ConnectorType.Injected,
                        name: WalletType.FuelWallet,
                        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwRkY4OCIvPgo8cGF0aCBkPSJNOCAxMkM4IDEwLjg5NTQgOC44OTU0MyAxMCAxMCAxMEgyMkMyMy4xMDQ2IDEwIDI0IDEwLjg5NTQgMjQgMTJWMjBDMjQgMjEuMTA0NiAyMy4xMDQ2IDIyIDIyIDIySDEwQzguODk1NDMgMjIgOCAyMS4xMDQ2IDggMjBWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQgMTZDMjQgMTQuODk1NCAyMy4xMDQ2IDE0IDIyIDE0SDI2QzI3LjEwNDYgMTQgMjggMTQuODk1NCAyOCAxNlYxNkMyOCAxNy4xMDQ2IDI3LjEwNDYgMTggMjYgMThIMjJDMjMuMTA0NiAxOCAyNCAxNy4xMDQ2IDI0IDE2WiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMiIgZmlsbD0iIzAwRkY4OCIvPgo8L3N2Zz4K',
                        rdns: 'fuel-wallet',
                    } as FuelWalletInfo));

                    // For Fuel wallet, skip key derivation and go directly to AccountConnected
                    console.log('Setting onboarding state to AccountConnected for Fuel wallet after connection');
                    dispatch(setOnboardingState(OnboardingState.AccountConnected));
                    console.log('Onboarding state set to AccountConnected after connection');
                }
            }
        } catch (err) {
            console.error('Error connecting to Fuel wallet:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to Fuel wallet');
        } finally {
            setIsConnecting(false);
        }
    }, [fuel, dispatch]);

    const disconnect = useCallback(async () => {
        if (!fuel) return;

        try {
            console.log('Disconnecting from Fuel wallet...');
            await fuel.disconnect();
            setIsConnected(false);
            setAddress(undefined);
            dispatch(clearSourceAccount());
            // Reset onboarding state when disconnecting
            dispatch(setOnboardingState(OnboardingState.Disconnected));
        } catch (err) {
            console.error('Error disconnecting from Fuel wallet:', err);
            setError(err instanceof Error ? err.message : 'Failed to disconnect from Fuel wallet');
        }
    }, [fuel, dispatch]);

    const getAccounts = useCallback(async () => {
        if (!fuel || !isConnected) return [];

        try {
            const accounts = await fuel.accounts();
            console.log('Getting accounts:', accounts);
            return accounts || [];
        } catch (err) {
            console.error('Error getting Fuel accounts:', err);
            return [];
        }
    }, [fuel, isConnected]);

    return {
        fuel,
        isConnected,
        address,
        isConnecting,
        error,
        connect,
        disconnect,
        getAccounts,
    };
};
