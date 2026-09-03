import { custom } from "valibot";
import DataLoader from "dataloader";
import type { BatchLoadFn } from "dataloader";

/**
 * Creates a loader with automatic caching, batching, and deduplication
 */
export function defineLoader<K, V>(fn: BatchLoadFn<K, V>) {
	const loader = new DataLoader(fn, {
		batch: true,
		cacheKeyFn: (key) => JSON.stringify(key),
	});

	// TODO: Should probably update the batch window to 10ms

	return (id: K) => loader.load(id);
}

export function hashstring() {
	return custom<`0x${string}`>((val) => typeof val === "string" && val.startsWith("0x"));
}

/**
 * Capitalize the first character of a string
 */
export function capitalize(str: string, opts: { mode: "first" | "all" } = { mode: "first" }): string {
	if (opts.mode === "all") return str?.toUpperCase();
	return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

/**
 * Checks that a value is not null or undefined
 */
export function defined<TData>(data: TData): data is NonNullable<typeof data> {
	const isNull = data === null;
	const isUndefined = data === undefined;

	return !isNull && !isUndefined;
}

export function formatNumber(number: number | bigint, options: Parameters<typeof Intl.NumberFormat>[1] = {}) {
	return new Intl.NumberFormat("en-GB", options).format(number);
}

export function iife<T>(fn: () => T): T {
	return fn();
}

export function raise(err: string, options?: ErrorOptions): never {
	throw new Error(err, options);
}

/**
 * Retries a function n number of times before giving up
 */
export async function retry<T>(fn: () => Promise<T>, retries: number, __count = 1): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		if (__count > retries) throw error;
		await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** __count));
		return retry(fn, retries, __count + 1);
	}
}

const is = (level: any) => process.env.LOG_LEVEL === level;

export const logger = {
	debug(...any: any[]) {
		if (is("DEBUG")) {
			console.log(`DEBUG`, ...any);
		}
	},
	info(...any: any[]) {
		if (is("DEBUG") || is("INFO")) {
			console.log(`INFO`, ...any);
		}
	},
	warn(...any: any[]) {
		if (is("DEBUG") || is("INFO") || is("WARN")) {
			console.log(`WARNING`, ...any);
		}
	},
	error(...any: any[]) {
		if (is("DEBUG") || is("INFO") || is("WARN") || is("ERROR")) {
			console.log(`ERROR`, ...any);
		}
	},
};

export function safeParseInt(value: any) {
	try {
		const number = Number.parseInt(value);
		if (Number.isNaN(number)) return null;
		return number;
	} catch {
		return null;
	}
}

export function hexToNumber(hex: string) {
	return Number.parseInt(hex, 16);
}

export function numberToHex(number: number | bigint) {
	return `0x${number.toString(16)}` as const;
}

export function isHexEqual(...values: (`0x${string}` | undefined)[]) {
	if (values.length < 2) {
		return false;
	}

	if (values.some((value) => value === undefined)) {
		return false; // Handles the isHexEqual(undefined, undefined)
	}

	const first = values[0]?.toLowerCase();

	return values.every((value) => value?.toLowerCase() === first);
}

export type MakeNonNullable<T, K extends keyof T> = Omit<T, K> & {
	[P in K]: NonNullable<T[P]>;
};
