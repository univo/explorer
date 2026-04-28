import { includesEvents } from '@/conditions/includesEvents';
import { getTokenAddressFromPoolIndex } from '@/helpers/curve';
import { createEvent } from '@/insights/createEvent';
import { createFunction } from '@/insights/createFunction';
import type { Interpreter } from '@/insights/interpretTx';

import type { LiquidityChange } from '.';

// 0x577daa87c2fc1ec374ce172bb6df96ff290d2a74e3da867e2c1c9ee4bf42169c
const RemoveLiquidity = createEvent('RemoveLiquidity', [
  { indexed: true, type: 'address', name: 'provider' },
  { indexed: false, type: 'uint256[3]', name: 'token_amounts' },
  { indexed: false, type: 'uint256[3]', name: 'fees' },
  { indexed: false, type: 'uint256', name: 'token_supply' },
]);

const getTokenAddressFromPoolIndex = (deps: Pick<Dependencies, 'provider'>) => {
  return async (pool: string, index: string) => {
    const contract = CurvePool__factory.connect(pool, deps.provider);
    return contract.coins(index);
  };
};

export const curveRemoveAllLiquidity: Interpreter<LiquidityChange> = {
  name: 'liquidityChange_curveRemoveAllLiquidity',
  condition: tx => includesEvents(tx, [RemoveLiquidity]),
  handler: deps => async tx => {
    const promises = RemoveLiquidity.decode(tx).map<Promise<LiquidityChange[]>>(async log => {
      return Promise.all(
        log.outputs.token_amounts.map<Promise<LiquidityChange>>(async (quantity, index) => {
          const address = await getTokenAddressFromPoolIndex(deps)(log.address, String(index));

          const [token, account, liquidityPool] = await Promise.all([
            deps.loaders.token.load(address),
            deps.loaders.account.load(log.outputs.provider),
            deps.loaders.account.load(log.address),
          ]);

          return {
            token,
            quantity,
            hash: log.hash,
            action: 'remove',
            type: 'liquidityChange',
            liquidityProvider: { account, address: log.outputs.provider },
            liquidityPool: { address: log.address, account: liquidityPool },
          };
        }),
      );
    });

    const results = await Promise.all(promises);

    return results.flat();
  },
};

// 0x5299681f85a4f26f6b39d14d2937b93cb5985182b9680f9a0fb094a659780225
const RemoveLiquidityOne = createEvent('RemoveLiquidityOne', [
  { indexed: true, name: 'provider', type: 'address' },
  { indexed: false, name: 'token_amount', type: 'uint256' },
  { indexed: false, name: 'coin_amount', type: 'uint256' },
]);

const remove_liquidity_one_coin = createFunction({
  stateMutability: 'nonpayable',
  name: 'remove_liquidity_one_coin',
  inputs: [
    { type: 'uint256', name: '_token_amount' },
    { type: 'int128', name: 'i' },
    { type: 'uint256', name: 'min_amount' },
  ],
});

export const curveRemoveSingleLiquidity: Interpreter<LiquidityChange> = {
  name: 'liquidityChange_curveRemoveSingleLiquidity',
  condition: tx => includesEvents(tx, [RemoveLiquidityOne]),
  handler: deps => async tx => {
    const inputs = remove_liquidity_one_coin.decode(tx);

    return Promise.all(
      RemoveLiquidityOne.decode(tx).map<Promise<LiquidityChange>>(async log => {
        const address = await getTokenAddressFromPoolIndex(deps)(log.address, inputs.i);

        const [token, account, liquidityPool] = await Promise.all([
          deps.loaders.token.load(address),
          deps.loaders.account.load(log.outputs.provider),
          deps.loaders.account.load(log.address),
        ]);

        return {
          token,
          hash: log.hash,
          action: 'remove',
          type: 'liquidityChange',
          quantity: log.outputs.coin_amount,
          liquidityProvider: { account, address: log.outputs.provider },
          liquidityPool: { address: log.address, account: liquidityPool },
        };
      }),
    );
  },
};

// 0x29b82c91dd9991bfc72235cf1b8499afb94db8e87b233ccf86d2d6c3531ff2dc
const RemoveLiquidityImbalance = createEvent('RemoveLiquidityImbalance', [
  { indexed: true, name: 'provider', type: 'address' },
  { indexed: false, name: 'token_amounts', type: 'uint256[3]' },
  { indexed: false, name: 'fees', type: 'uint256[3]' },
  { indexed: false, name: 'invariant', type: 'uint256' },
  { indexed: false, name: 'token_supply', type: 'uint256' },
]);

export const curveRemoveImbalancedLiquidity: Interpreter<LiquidityChange> = {
  name: 'liquidityChange_curveRemoveImbalancedLiquidity',
  condition: tx => includesEvents(tx, [RemoveLiquidityImbalance]),
  handler: deps => async tx => {
    const results = await Promise.all(
      RemoveLiquidityImbalance.decode(tx).map<Promise<LiquidityChange[]>>(async log => {
        return Promise.all(
          log.outputs.token_amounts.map<Promise<LiquidityChange>>(async (quantity, index) => {
            const address = await getTokenAddressFromPoolIndex(deps)(log.address, String(index));

            const [token, account, liquidityPool] = await Promise.all([
              deps.loaders.token.load(address),
              deps.loaders.account.load(log.outputs.provider),
              deps.loaders.account.load(log.address),
            ]);

            return {
              token,
              quantity,
              hash: log.hash,
              action: 'remove',
              type: 'liquidityChange',
              liquidityProvider: { account, address: log.outputs.provider },
              liquidityPool: { address: log.address, account: liquidityPool },
            };
          }),
        );
      }),
    );

    return results.flat().filter(change => change.quantity !== '0'); // Only keep non-zero changes
  },
};

// 0x532b99ddd69d477a9ebb3384dbe6cd389659a3ef6ac78a92d327c07db970a4c7
const AddLiquidity = createEvent('AddLiquidity', [
  { indexed: true, name: 'provider', type: 'address' },
  { indexed: false, name: 'token_amounts', type: 'uint256[3]' },
  { indexed: false, name: 'fees', type: 'uint256[3]' },
  { indexed: false, name: 'invariant', type: 'uint256' },
  { indexed: false, name: 'token_supply', type: 'uint256' },
]);

export const curveSupplyImbalancedLiquidity: Interpreter<LiquidityChange> = {
  name: 'liquidityChange_curveSupplySingleLiquidity',
  condition: tx => includesEvents(tx, [AddLiquidity]),
  handler: deps => async tx => {
    const results = await Promise.all(
      AddLiquidity.decode(tx).map<Promise<LiquidityChange[]>>(async log => {
        return Promise.all(
          log.outputs.token_amounts.map<Promise<LiquidityChange>>(async (quantity, index) => {
            const address = await getTokenAddressFromPoolIndex(deps)(log.address, String(index));

            const [token, account, liquidityPool] = await Promise.all([
              deps.loaders.token.load(address),
              deps.loaders.account.load(log.outputs.provider),
              deps.loaders.account.load(log.address),
            ]);

            return {
              token,
              quantity,
              hash: log.hash,
              action: 'supply',
              type: 'liquidityChange',
              liquidityProvider: { account, address: log.outputs.provider },
              liquidityPool: { address: log.address, account: liquidityPool },
            };
          }),
        );
      }),
    );

    return results.flat().filter(change => change.quantity !== '0'); // Only keep non-zero changes
  },
};
