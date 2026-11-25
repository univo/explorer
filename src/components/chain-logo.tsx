import type { Chain } from "@/constants";
import { ArbitrumLogo, BaseLogo } from "./icons";

export function ChainLogo({ chain, className = "size-4 shrink-0" }: { chain: Chain; className?: string }) {
	switch (chain) {
		case 1:
			return <img alt="" className={`${className} rounded-full`} src="https://etherscan.io/token/images/ether.png" />;
		case 42161:
			return <ArbitrumLogo className={className} aria-hidden="true" />;
		case 8453:
			return <BaseLogo className={className} aria-hidden="true" />;
	}
}
