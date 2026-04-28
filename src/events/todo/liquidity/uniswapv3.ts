// Uniswap V3

import { includesEvents } from '@/conditions/includesEvents';
import { createEvent } from '@/insights/createEvent';
import type { Interpreter } from '@/insights/interpretTx';

import type { LiquidityChange } from '.';

// Mint: 0x89d75075eaef8c21ab215ae54144ba563b850ee7460f89b2a175fd0e267ed330
const mintEvent = createEvent('Mint', [
  { indexed: false, name: 'sender', type: 'address' },
  { indexed: true, name: 'owner', type: 'address' },
  { indexed: true, name: 'tickLower', type: 'int24' },
  { indexed: true, name: 'tickUpper', type: 'int24' },
  { indexed: false, name: 'amount', type: 'uint128' },
  { indexed: false, name: 'amount0', type: 'uint256' },
  { indexed: false, name: 'amount1', type: 'uint256' },
]);

export const uniswapV3Mint: Interpreter<LiquidityChange> = {
  name: 'uniswapV3_uniswapV2Mint',
  condition: tx => includesEvents(tx, [mintEvent]),
  handler: deps => async tx => {
    const promises = mintEvent.decode(tx).map<Promise<LiquidityChange[]>>(async log => {
      const [liquidityPool, liquidityProvider, [address0, address1]] = await Promise.all([
        deps.loaders.account.load(log.address),
        deps.loaders.account.load(log.outputs.owner),
        deps.loaders.pairContractTokens.load(log.address),
      ]);

      const [token0, token1] = await Promise.all([
        deps.loaders.token.load(address0),
        deps.loaders.token.load(address1),
      ]);

      deps.tags.add(log.hash, [log.address, token0.address, token1.address]);

      return [
        {
          token: token0,
          type: 'liquidityChange',
          hash: log.hash,
          action: 'supply',
          quantity: log.outputs.amount0,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.owner, account: liquidityProvider },
        },
        {
          token: token1,
          type: 'liquidityChange',
          hash: log.hash,
          action: 'supply',
          quantity: log.outputs.amount1,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.owner, account: liquidityProvider },
        },
      ];
    });

    const results = await Promise.all(promises);

    return results.flat();
  },
};

// Uniswap V3
// Burn: 0x2080ac3618480f84a18be4141b78ce5fd44c60281988521d64cb6f9c4202178d
const burnEvent = createEvent('Burn', [
  { indexed: true, name: 'owner', type: 'address' },
  { indexed: true, name: 'tickLower', type: 'int24' },
  { indexed: true, name: 'tickUpper', type: 'int24' },
  { indexed: false, name: 'amount', type: 'uint128' },
  { indexed: false, name: 'amount0', type: 'uint256' },
  { indexed: false, name: 'amount1', type: 'uint256' },
]);

export const uniswapV3Burn: Interpreter<LiquidityChange> = {
  name: 'uniswapV3_uniswapV2Burn',
  condition: tx => includesEvents(tx, [burnEvent]),
  handler: deps => async tx => {
    const promises = burnEvent.decode(tx).map<Promise<LiquidityChange[]>>(async log => {
      const [liquidityPool, liquidityProvider, [address0, address1]] = await Promise.all([
        deps.loaders.account.load(log.address),
        deps.loaders.account.load(log.outputs.owner),
        deps.loaders.pairContractTokens.load(log.address),
      ]);

      const [token0, token1] = await Promise.all([
        deps.loaders.token.load(address0),
        deps.loaders.token.load(address1),
      ]);

      deps.tags.add(log.hash, [log.address, log.outputs.owner, token0.address, token1.address]);

      return [
        {
          token: token0,
          type: 'liquidityChange',
          hash: log.hash,
          action: 'remove',
          quantity: log.outputs.amount0,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.owner, account: liquidityProvider },
        },
        {
          token: token1,
          type: 'liquidityChange',
          hash: log.hash,
          action: 'remove',
          quantity: log.outputs.amount1,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.owner, account: liquidityProvider },
        },
      ];
    });

    const results = await Promise.all(promises);

    return results.flat();
  },
};
