import { useEffect, useRef } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingDots } from '@/components/Loading/LoadingDots';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketOraclePrice } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

const getMidMarketPriceColor = ({
  midMarketPrice,
  lastMidMarketPrice,
}: {
  midMarketPrice?: BigNumber;
  lastMidMarketPrice?: BigNumber;
}) => {
  if (lastMidMarketPrice == null || midMarketPrice == null) {
    return 'var(--color-text-2)';
  }
  if (midMarketPrice.lt(lastMidMarketPrice)) {
    return 'var(--color-negative)';
  }
  if (midMarketPrice.gt(lastMidMarketPrice)) {
    return 'var(--color-positive)';
  }
  return 'var(--color-text-2)';
};

export const MidMarketPrice = ({ richColor = true }: { richColor?: boolean }) => {
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  // Using oracle price instead of mid-market price for more accurate pricing
  const oraclePriceRaw = useAppSelector(getCurrentMarketOraclePrice);
  const oraclePrice = oraclePriceRaw ? new BigNumber(oraclePriceRaw) : undefined;
  const midMarketPriceLoading = useAppSelector(BonsaiHelpers.currentMarket.midPrice.loading);
  const isLoading =
    midMarketPriceLoading === 'idle' ||
    (midMarketPriceLoading === 'pending' && oraclePrice == null);

  const lastOraclePrice = useRef(oraclePrice);

  const priceColor = richColor
    ? getMidMarketPriceColor({
        midMarketPrice: oraclePrice,
        lastMidMarketPrice: lastOraclePrice.current,
      })
    : 'var(--color-text-2)';

  useEffect(() => {
    lastOraclePrice.current = oraclePrice;
  }, [oraclePrice]);

  if (isLoading) {
    return <LoadingDots size={5} />;
  }

  return (
    <$Output
      withSubscript
      type={OutputType.Fiat}
      value={oraclePrice}
      color={priceColor}
      fractionDigits={tickSizeDecimals}
    />
  );
};

const $Output = styled(Output)<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}
`;
