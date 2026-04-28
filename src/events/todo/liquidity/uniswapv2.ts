// Uniswap V2

import { includesEvents } from '@/conditions/includesEvents';
import { createEvent } from '@/insights/createEvent';
import type { Interpreter } from '@/insights/interpretTx';

import type { LiquidityChange } from '.';

// Mint: 0x48d9cc134d7e434cacf332d714b75fcb8c130009af8c202a2a54d9eb16a8a9e5
const mintEvent = createEvent('Mint', [
  { indexed: true, name: 'sender', type: 'address' },
  { indexed: false, name: 'amount0', type: 'uint256' },
  { indexed: false, name: 'amount1', type: 'uint256' },
]);

export const uniswapV2Mint: Interpreter<LiquidityChange> = {
  name: 'uniswapV2_uniswapV2Mint',
  condition: tx => includesEvents(tx, [mintEvent]),
  handler: deps => async tx => {
    const promises = mintEvent.decode(tx).map<Promise<LiquidityChange[]>>(async log => {
      const [liquidityPool, liquidityProvider, [address0, address1]] = await Promise.all([
        deps.loaders.account.load(log.address),
        deps.loaders.account.load(log.outputs.sender),
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
          action: 'supply',
          hash: log.hash,
          quantity: log.outputs.amount0,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.sender, account: liquidityProvider },
        },
        {
          token: token1,
          type: 'liquidityChange',
          action: 'supply',
          hash: log.hash,
          quantity: log.outputs.amount1,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.sender, account: liquidityProvider },
        },
      ];
    });

    const results = await Promise.all(promises);

    return results.flat();
  },
};

// Uniswap V2
// Burn: 0x4113cf142204202124affdbf911b28fcb78ea5bd853effbcec130ba33ecf5045
const burnEvent = createEvent('Burn', [
  { indexed: true, name: 'sender', type: 'address' },
  { indexed: false, name: 'amount0', type: 'uint256' },
  { indexed: false, name: 'amount1', type: 'uint256' },
  { indexed: true, name: 'to', type: 'address' },
]);

export const uniswapV2Burn: Interpreter<LiquidityChange> = {
  name: 'uniswapV2_uniswapV2Burn',
  condition: tx => includesEvents(tx, [burnEvent]),
  handler: deps => async tx => {
    const promises = burnEvent.decode(tx).map<Promise<LiquidityChange[]>>(async log => {
      const [liquidityPool, liquidityProvider, [address0, address1]] = await Promise.all([
        deps.loaders.account.load(log.address),
        deps.loaders.account.load(log.outputs.to),
        deps.loaders.pairContractTokens.load(log.address),
      ]);

      const [token0, token1] = await Promise.all([
        deps.loaders.token.load(address0),
        deps.loaders.token.load(address1),
      ]);

      deps.tags.add(log.hash, [log.address, log.outputs.to, log.outputs.sender, token0.address, token1.address]);

      return [
        {
          token: token0,
          action: 'remove',
          type: 'liquidityChange',
          hash: log.hash,
          quantity: log.outputs.amount0,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.to, account: liquidityProvider },
        },
        {
          token: token1,
          action: 'remove',
          type: 'liquidityChange',
          hash: log.hash,
          quantity: log.outputs.amount1,
          liquidityPool: { address: log.address, account: liquidityPool },
          liquidityProvider: { address: log.outputs.to, account: liquidityProvider },
        },
      ];
    });

    const results = await Promise.all(promises);

    return results.flat();
  },
};
