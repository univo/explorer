import type { Event } from "univo";

// TODO
// There are so many issues with this interface. Notably it doesn't support JOINs in anyway. But it's
// good enough for now for simple use cases like calculating balances. Future improvements should
// modify the `reduce` interface to provide the key and a list of values. This would allow consumers
// to reduce results from different mappers. Also need to consider the possibility that the input won't
// just be events. It could be some other form of state. It might also be true that these are two distinct
// types of computation that should be expressed by seperate abstractions.

// Expresses a computation

type InferEvents<TEvent> = TEvent extends Event<any, infer TValue> ? TValue : never;

interface Aggregate<TEvents extends readonly Event<any, any>[], TValue> {
	id: string;

	events: TEvents;

	handlers: {
		map: (event: InferEvents<TEvents[number]>) => Array<[key: string, value: TValue]>;

		reduce: (result: TValue, value: TValue) => TValue;
	};
}

export function aggregate<const TEvents extends readonly Event<any, any>[], TValue>(aggregate: Aggregate<TEvents, TValue>) {
	return aggregate;
}

// Performs that computation. Assumes that the entire dataset fits on this machine.

export function execute<TEvents extends readonly Event<any, any>[], TValue>(
	aggregate: Aggregate<TEvents, TValue>,
	events: InferEvents<TEvents[number]>[],
) {
	const partitions: Record<string, TValue[]> = {};

	for (const event of events) {
		for (const [key, value] of aggregate.handlers.map(event)) {
			if (partitions[key] === undefined) {
				partitions[key] = [];
			}

			partitions[key].push(value);
		}
	}

	const results: Record<string, TValue> = {};

	for (const key in partitions) {
		const values = partitions[key];

		if (values.length === 0) {
			throw new Error("Partition wouldn't exist unless a value with this key was mapped");
		}

		const [initial, ...rest] = values;

		let result = initial;

		for (const value of rest) {
			result = aggregate.handlers.reduce(result, value);
		}

		results[key] = result;
	}

	return results;
}
