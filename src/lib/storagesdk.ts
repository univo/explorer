import { defineAdapter, type Adapter } from "@storagesdk/core/adapter";

export function r2(config: { binding: R2Bucket }): Adapter {
	return defineAdapter({
		name: "r2-binding",
		raw: config.binding,
	});
}
