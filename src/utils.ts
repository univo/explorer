import { custom } from "valibot";

export function hashstring() {
	return custom<`0x${string}`>((val) => typeof val === "string" && val.startsWith("0x"));
}

/**
 * Capitalize the first character of a string
 */
export function capitalize(str: string, opts: { mode: "first" | "all" } = { mode: "first" }): string | undefined {
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

const dtf = new Intl.DateTimeFormat("en-GB", {
	hour12: true,
	hour: "numeric",
	minute: "2-digit",
	weekday: "short",
	month: "short",
	day: "numeric",
	year: "2-digit",
	timeZone: "UTC",
});

export function formatDateTime(date: Date) {
	return dtf.format(date);
}

const tf = new Intl.DateTimeFormat("en-GB", {
	hour12: true,
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC",
});

export function formatTime(date: Date) {
	return tf.format(date);
}

const unit_strings = ["s", "m", "hr", "d", "w", "mo", "yr"] as const;
const units_seconds = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Number.POSITIVE_INFINITY];

export function formatRelativeDate(date: Date) {
	const delta_seconds = Math.round((date.getTime() - Date.now()) / 1000);
	const unit_index = units_seconds.findIndex((cutoff) => cutoff > Math.abs(delta_seconds));
	const divisor = unit_index ? units_seconds[unit_index - 1]! : 1;
	return `${Math.abs(Math.round(delta_seconds / divisor))}${unit_strings[unit_index]}`;
}

export function formatNumber(number: number, options: Parameters<typeof Intl.NumberFormat>[1] = {}) {
	return new Intl.NumberFormat("en-GB", options).format(number);
}

export function formatDate(date: Date) {
	return date.toLocaleDateString("en", {
		month: "numeric",
		day: "numeric",
		year: "2-digit",
	});
}

export function iife<T>(fn: () => T): T {
	return fn();
}

export function nonNullable<Type>(value: Type): value is NonNullable<Type> {
	return value !== null && value !== undefined;
}

/**
 * Takes an integer as a string like `18446744073709551615` and returns a number like `18446744073.709551615`.
 */
export function parseStringInt(string: string, decimals: number) {
	const number = Number(string);
	return number / 10 ** decimals;
}

export function raise(err: string, options?: ErrorOptions): never {
	throw new Error(err, options);
}

/**
 * Retries a function n number of times before giving up
 */
export async function retry<T extends (...arg0: any[]) => any>(
	fn: T,
	args: Parameters<T>,
	retries: number,
	__count = 1,
): Promise<Awaited<ReturnType<T>>> {
	try {
		return await fn(...args);
	} catch (error) {
		if (__count > retries) throw error;
		await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** __count));
		return retry(fn, args, retries, __count + 1);
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

export function getInvertedDictionary<K extends string | number, V extends string | number>(dict: Record<K, V>) {
	const result = {} as Record<V, K>;

	for (const key in dict) {
		result[dict[key]] = key;
	}

	return result;
}
