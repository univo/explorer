import { http } from "viem";
import { rateLimit } from "@ponder/utils";

export function createTransport(url: string) {
	const base = http(url, { batch: true, retryCount: 3, retryDelay: 1000 });
	return rateLimit(base, { requestsPerSecond: 30 });
}
