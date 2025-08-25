import { useEffect, useState, type FormEvent } from 'react';

import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useFakeParentSubaccount } from '@/bonsai/websocket/useFakeParentSubaccount';
import { useAccounts } from '@/hooks/useAccounts';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { log } from '@/lib/telemetry';

type DepositFormProps = {
  onDeposit?: () => void;
  onError?: (_: Error) => void;
};

export const TestnetDepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();
  const { dydxAddress, getSubaccounts, sourceAccount } = useAccounts();
  const { requestFaucetFunds } = useSubaccount();
  const subAccount = useAppSelector(getSubaccount);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const dydxChainId = useEnvConfig('dydxChainId');
  const { canInject, injectFakeBalance } = useFakeParentSubaccount();

  const [isLoading, setIsLoading] = useState(false);
  const [isFakeLoading, setIsFakeLoading] = useState(false);

  // Check if this is a Fuel wallet
  const isFuelWallet = sourceAccount?.chain === 'fuel';

  // call getSubaccounts once the subaccount detected via ws from bonsai
  useEffect(() => {
    if (dydxAddress && isLoading && subAccount) {
      setIsLoading(false);
      getSubaccounts({ dydxAddress });
    }
  }, [subAccount]);

  const handleFakeDeposit = async () => {
    setIsFakeLoading(true);
    try {
      // Inject 10,000 USDC for Fuel wallets
      injectFakeBalance({ equity: '10000.00', freeCollateral: '10000.00' });
      onDeposit?.();
      setIsFakeLoading(false);
    } catch (error) {
      log('TestnetDepositForm/handleFakeDeposit', error);
      onError?.(error as Error);
      setIsFakeLoading(false);
    }
  };

  return (
    <$Form
      onSubmit={async (e: FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        try {
          await requestFaucetFunds();
          onDeposit?.();

          // do not stop loading if the subaccount is not yet created.
          // subaccount should only not existing during onboarding on first deposit.
          if (subAccount) {
            setIsLoading(false);
          }
        } catch (error) {
          log('TestnetDepositForm/requestFaucetFunds', error);
          onError?.(error);
          setIsLoading(false);
        }
      }}
    >
      {isFuelWallet && canInject ? (
        <>
          <p>
            {stringGetter({
              key: STRING_KEYS.CREDITED_WITH,
              params: { AMOUNT_USD: 10000 },
            })}
          </p>
          <$Footer>
            {!canAccountTrade ? (
              <OnboardingTriggerButton size={ButtonSize.Base} />
            ) : (
              <Button 
                action={ButtonAction.Primary} 
                type={ButtonType.Button}
                state={{ isLoading: isFakeLoading }}
                onClick={handleFakeDeposit}
              >
                {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
              </Button>
            )}
          </$Footer>
        </>
      ) : (
        <>
          <p>
            {stringGetter({
              key: STRING_KEYS.CREDITED_WITH,
              params: {
                AMOUNT_USD:
                  dydxChainId === 'dydx-testnet-4' || dydxChainId === 'dydxprotocol-testnet'
                    ? 1000
                    : 100,
              },
            })}
          </p>
          <$Footer>
            {!canAccountTrade ? (
              <OnboardingTriggerButton size={ButtonSize.Base} />
            ) : (
              <Button action={ButtonAction.Primary} type={ButtonType.Submit} state={{ isLoading }}>
                {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
              </Button>
            )}
          </$Footer>
        </>
      )}
      
    </$Form>
  );
};
const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Footer = styled.footer`
  ${formMixins.footer}

  button {
    --button-width: 100%;
  }
`;
