# Fake Parent Subaccount Injection for Fuel Wallets

This module provides functionality to inject fake parent subaccount data into the WebSocket system for Fuel wallet testing and demonstration purposes.

## Overview

The fake injection system allows Fuel wallet users to simulate account balance data without requiring real blockchain transactions. This is integrated into the testnet deposit form to provide a seamless testing experience.

## Integration Points

### Testnet Deposit Form

For Fuel wallets, the standard testnet deposit form automatically provides fake balance injection instead of real faucet funds. Users connecting with Fuel wallets will see:

- **Amount**: $10,000 USDC credited to account
- **Instant**: Balance updates immediately in UI
- **Realistic**: Data flows through same calculation pipeline as real balances

### WebSocket Integration

The fake injection system integrates with the existing WebSocket infrastructure:

- **`parentSubaccount.ts`** - Modified to handle `fake_injection` message types
- **`indexerWebsocket.ts`** - Provides the `injectFakeMessage` method

## How It Works

### Data Flow

1. **User clicks "Deposit Funds"** in testnet form (Fuel wallet)
2. **Fake USDC Asset Position** created with $10k balance
3. **WebSocket Injection** - Fake data injected into message stream
4. **Calculation Pipeline** - Processed through `calculateSubaccountSummary`
5. **State Update** - Redux state updated with calculated equity/freeCollateral BigNumbers
6. **UI Update** - Account balance displays immediately

### Technical Implementation

The injection works by:

1. Creating properly formatted `FakeChildSubaccountData` with USDC asset position
2. Wrapping in `FakeParentSubaccountUpdate` messages with required metadata
3. Using `IndexerWebsocket.injectFakeMessage()` to inject into message stream
4. The `parentSubaccount.ts` handler detects `fake_injection` type messages
5. Fake data merged with existing data or creates new data if none exists

## Code Structure

### Core Files

1. **`parentSubaccountFake.ts`** - Fake data structures and injection functions
2. **`useFakeParentSubaccount.ts`** - React hook providing injection functionality
3. **`TestnetDepositForm.tsx`** - Modified to detect Fuel wallets and use fake injection

### Data Structure

```typescript
interface FakeChildSubaccountData {
  address: string;
  subaccountNumber: number;
  usdcBalance: string;  // e.g., "10000.00"
  openPerpetualPositions: Record<string, never>;
  assetPositions: {
    USDC: {
      symbol: 'USDC';
      side: IndexerPositionSide.LONG;
      size: string;  // USDC balance amount
      assetId: '0';
      subaccountNumber: number;
    };
  };
}
```

## Usage

### Automatic (Testnet Deposit Form)

1. Connect Fuel wallet
2. Navigate to deposit dialog
3. Click "Deposit Funds" 
4. $10,000 USDC balance appears instantly

### Programmatic (Hook)

```typescript
import { useFakeParentSubaccount } from '@/bonsai/websocket/useFakeParentSubaccount';

function MyComponent() {
  const { canInject, injectFakeBalance } = useFakeParentSubaccount();

  const handleInject = () => {
    if (canInject) {
      injectFakeBalance({ equity: '25000.00' });
    }
  };

  return <button onClick={handleInject}>Inject $25k Balance</button>;
}
```

## API Reference

### Hook: `useFakeParentSubaccount()`

Returns:
- `canInject: boolean` - Whether injection is possible
- `injectFakeBalance(balanceData?)` - Inject specific balance values
- `injectRandomBalance()` - Inject random balance values
- `address: string` - Current wallet address
- `subaccount: number` - Current subaccount number

### Key Functions

#### `createSampleParentSubaccount(address, subaccountNumber, balanceData?)`
Creates fake parent subaccount with specified USDC balance.

#### `injectFakeParentSubaccountMessage(websocket, data, id)`
Injects fake data into WebSocket message stream.

## Important Technical Details

### Calculation Pipeline Compatibility

The fake data is designed to work with the existing calculation pipeline:

1. **USDC Asset Position** → `calculateSubaccountSummaryCore()` → `quoteBalance`
2. **Quote Balance** → `calculateSubaccountSummaryDerived()` → `equity`/`freeCollateral` BigNumbers
3. **BigNumbers** → UI selectors → Displayed values

This ensures fake data behaves identically to real indexer data.

### Subscription Requirements

Injection requires active WebSocket subscription for current wallet address and subaccount. The system automatically checks subscription status before injection.

### Address Handling

The system properly handles Fuel wallet addresses by:
- Using `sourceAccount.address` from Redux state
- Normalizing addresses to lowercase for consistency
- Supporting the `WalletNetworkType.Fuel` wallet type

## Security Notes

⚠️ **Development Only**: This system is for development and testing. It:
- Only affects local UI state
- Does not interact with real blockchain data
- Should be disabled in production environments

## Wallet Type Detection

The testnet deposit form automatically detects Fuel wallets using:

```typescript
const isFuelWallet = sourceAccount?.chain === 'fuel';
```

When `isFuelWallet && canInject` is true, the form shows fake injection instead of real faucet functionality.