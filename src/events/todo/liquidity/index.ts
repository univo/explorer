import { balancerChange } from '@/univo/events/liquidityChange/balancer';
import {
  curveRemoveAllLiquidity,
  curveRemoveImbalancedLiquidity,
  curveRemoveSingleLiquidity,
  curveSupplyImbalancedLiquidity,
} from '@/univo/events/liquidityChange/curve';
import { uniswapV2Burn, uniswapV2Mint } from '@/univo/events/liquidityChange/uniswapv2';
import { uniswapV3Burn, uniswapV3Mint } from '@/univo/events/liquidityChange/uniswapv3';
import type { AddressAndAccount, Token } from '@/insights/types';

export const liquidityChanges = [
  balancerChange,
  uniswapV2Burn,
  uniswapV2Mint,
  uniswapV3Burn,
  uniswapV3Mint,
  curveRemoveAllLiquidity,
  curveRemoveSingleLiquidity,
  curveRemoveImbalancedLiquidity,
  curveSupplyImbalancedLiquidity,
];

export interface LiquidityChange {
  type: 'liquidityChange';
  hash: string;
  token: Token;
  quantity: string;
  action: 'supply' | 'remove';
  liquidityPool: AddressAndAccount;
  liquidityProvider: AddressAndAccount;
}
