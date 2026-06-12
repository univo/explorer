import {
	checkSignal,
	defineAdapter,
	emptyManifest,
	isAbortError,
	isInternalKey,
	nextSnapshotId,
	readManifest,
	StorageError,
	type Adapter,
	type BodyInput,
	type ReadOnlyAdapter,
	type StorageItem,
	type StorageItemMeta,
	writeManifest,
} from "@storagesdk/core/adapter";

const ADAPTER_NAME = "r2-binding";
const INTERNAL_PREFIX = ".storagesdk/";
const LOCATIONS_PREFIX = `${INTERNAL_PREFIX}locations/`;

type Location = {
	name: string;
	prefix: string;
};

export function r2(config: { binding: R2Bucket }): Adapter<R2Bucket> {
	return defineAdapter(createImpl(config.binding, { name: ADAPTER_NAME, prefix: "" }));
}

function createImpl(binding: R2Bucket, location: Location): Adapter<R2Bucket> {
	return {
		name: ADAPTER_NAME,
		raw: binding,
		async upload(key, body, opts) {
			await checkSignalAsync(opts?.signal);

			try {
				const object = await binding.put(toActualKey(location, key), toR2Body(body), {
					...(opts?.contentType !== undefined || opts?.cacheControl !== undefined
						? {
								httpMetadata: {
									...(opts.contentType !== undefined ? { contentType: opts.contentType } : {}),
									...(opts.cacheControl !== undefined ? { cacheControl: opts.cacheControl } : {}),
								},
							}
						: {}),
					...(opts?.metadata !== undefined ? { customMetadata: opts.metadata } : {}),
				});

				opts?.onProgress?.({ loaded: object.size, total: object.size });
				return toMeta(object, key);
			} catch (err) {
				throw asStorageError(err);
			}
		},
		async download(key, opts) {
			await checkSignalAsync(opts?.signal);

			try {
				const object = await binding.get(
					toActualKey(location, key),
					opts?.range !== undefined ? { range: opts.range } : undefined,
				);

				if (object === null) throw notFound(key);

				checkSignal(opts?.signal);
				const body = new Uint8Array(await object.arrayBuffer());

				return { ...toMeta(object, key), size: body.byteLength, body } satisfies StorageItem;
			} catch (err) {
				throw asStorageError(err);
			}
		},
		async head(key, opts) {
			await checkSignalAsync(opts?.signal);

			try {
				const object = await binding.head(toActualKey(location, key));
				if (object === null) throw notFound(key);
				return toMeta(object, key);
			} catch (err) {
				throw asStorageError(err);
			}
		},
		async list(opts) {
			await checkSignalAsync(opts?.signal);

			try {
				const out = await binding.list({
					prefix: toActualKey(location, opts?.prefix ?? ""),
					...(opts?.limit !== undefined ? { limit: opts.limit } : {}),
					...(opts?.cursor !== undefined ? { cursor: opts.cursor } : {}),
					...(opts?.delimiter !== undefined ? { delimiter: opts.delimiter } : {}),
					include: ["httpMetadata", "customMetadata"],
				});

				const items = out.objects
					.map((object) => ({ object, key: toLogicalKey(location, object.key) }))
					.filter(({ key }) => !isReservedKey(key))
					.map(({ object, key }) => toMeta(object, key));

				return out.truncated ? { items, cursor: out.cursor } : { items };
			} catch (err) {
				throw asStorageError(err);
			}
		},
		async delete(key, opts) {
			await checkSignalAsync(opts?.signal);

			try {
				await binding.delete(toActualKey(location, key));
			} catch (err) {
				throw asStorageError(err);
			}
		},
		async copy(from, to, opts) {
			await checkSignalAsync(opts?.signal);

			try {
				await copyObject(binding, location, from, location, to, opts?.signal);
			} catch (err) {
				throw asStorageError(err);
			}
		},
		async move(from, to, opts) {
			await checkSignalAsync(opts?.signal);

			try {
				await copyObject(binding, location, from, location, to, opts?.signal);
				await binding.delete(toActualKey(location, from));
			} catch (err) {
				throw asStorageError(err);
			}
		},
		async url(key, opts) {
			await checkSignalAsync(opts?.signal);

			await this.head(key, opts);
			return `r2://${encodeURIComponent(location.name)}/${encodeKey(key)}`;
		},
		async uploadUrl(_key, opts) {
			await checkSignalAsync(opts?.signal);
			throw new StorageError({
				code: "NotSupported",
				message: "R2 bucket bindings do not support presigned upload URLs",
			});
		},
		snapshots: {
			async create(opts) {
				await checkSignalAsync(opts?.signal);

				const id = nextSnapshotId(location.name);
				const snapshot = locationFor(id);

				try {
					await copyAllObjects(binding, location, snapshot, {
						...(opts?.signal !== undefined ? { signal: opts.signal } : {}),
						onProgress: (event) => opts?.onProgress?.({ scanned: event.copied, total: event.total }),
					});

					const snapshotImpl = createImpl(binding, snapshot);
					await writeManifest(snapshotImpl, emptyManifest({ location: location.name, snapshotId: null }));

					const thisImpl = createImpl(binding, location);
					const manifest = await readManifest(thisImpl);
					const info = {
						id,
						createdAt: new Date(),
						...(opts?.name !== undefined ? { name: opts.name } : {}),
					};

					manifest.snapshots.push(info);
					await writeManifest(thisImpl, manifest);

					return info;
				} catch (err) {
					await clearLocation(binding, snapshot).catch(() => {});
					throw asStorageError(err);
				}
			},
			async list() {
				return (await readManifest(createImpl(binding, location))).snapshots;
			},
			async head(id, opts) {
				await checkSignalAsync(opts?.signal);

				const manifest = await readManifest(createImpl(binding, location));
				const snapshot = manifest.snapshots.find((item) => item.id === id);
				if (snapshot === undefined) {
					throw new StorageError({ code: "NotFound", message: `snapshot ${id} not found` });
				}

				return snapshot;
			},
			async delete(id, opts) {
				await checkSignalAsync(opts?.signal);

				const thisImpl = createImpl(binding, location);
				const manifest = await readManifest(thisImpl);
				manifest.snapshots = manifest.snapshots.filter((item) => item.id !== id);

				await clearLocation(binding, locationFor(id));
				await writeManifest(thisImpl, manifest);
			},
			get(id) {
				const snapshotImpl = createImpl(binding, locationFor(id));

				return {
					download: (key, opts) => snapshotImpl.download(key, opts),
					head: (key, opts) => snapshotImpl.head(key, opts),
					list: (opts) => snapshotImpl.list(opts),
					url: (key, opts) => snapshotImpl.url(key, opts),
				} satisfies ReadOnlyAdapter;
			},
		},
		forks: {
			async create(opts) {
				await checkSignalAsync(opts.signal);

				const fork = locationFor(opts.name);
				const thisImpl = createImpl(binding, location);
				const manifest = await readManifest(thisImpl);

				if (manifest.forks.some((item) => item.name === opts.name) || (await locationExists(binding, fork))) {
					throw new StorageError({ code: "Conflict", message: `fork ${opts.name} already exists` });
				}

				if (opts.fromSnapshot !== undefined && !manifest.snapshots.some((item) => item.id === opts.fromSnapshot)) {
					throw new StorageError({
						code: "NotFound",
						message: `snapshot ${opts.fromSnapshot} not found`,
					});
				}

				const source = opts.fromSnapshot !== undefined ? locationFor(opts.fromSnapshot) : location;

				try {
					await copyAllObjects(binding, source, fork, {
						...(opts.signal !== undefined ? { signal: opts.signal } : {}),
						onProgress: opts.onProgress,
					});

					const forkImpl = createImpl(binding, fork);
					await writeManifest(
						forkImpl,
						emptyManifest({ location: location.name, snapshotId: opts.fromSnapshot ?? null }),
					);

					const info = {
						name: opts.name,
						createdAt: new Date(),
						...(opts.fromSnapshot !== undefined ? { fromSnapshot: opts.fromSnapshot } : {}),
					};

					manifest.forks.push(info);
					await writeManifest(thisImpl, manifest);

					return info;
				} catch (err) {
					await clearLocation(binding, fork).catch(() => {});
					throw asStorageError(err);
				}
			},
			async list() {
				return (await readManifest(createImpl(binding, location))).forks;
			},
			async head(name, opts) {
				await checkSignalAsync(opts?.signal);

				const manifest = await readManifest(createImpl(binding, location));
				const fork = manifest.forks.find((item) => item.name === name);
				if (fork === undefined) {
					throw new StorageError({ code: "NotFound", message: `fork ${name} not found` });
				}

				return fork;
			},
			async delete(name, opts) {
				await checkSignalAsync(opts?.signal);

				const thisImpl = createImpl(binding, location);
				const manifest = await readManifest(thisImpl);
				manifest.forks = manifest.forks.filter((item) => item.name !== name);

				await clearLocation(binding, locationFor(name));
				await writeManifest(thisImpl, manifest);
			},
			get(name) {
				return createImpl(binding, locationFor(name));
			},
		},
	};
}

function toActualKey(location: Location, key: string) {
	return `${location.prefix}${key}`;
}

async function checkSignalAsync(signal: AbortSignal | undefined) {
	await Promise.resolve();
	checkSignal(signal);
}

function toLogicalKey(location: Location, key: string) {
	return location.prefix !== "" && key.startsWith(location.prefix) ? key.slice(location.prefix.length) : key;
}

function locationFor(name: string): Location {
	return { name, prefix: `${LOCATIONS_PREFIX}${encodeURIComponent(name)}/` };
}

function isReservedKey(key: string) {
	return isInternalKey(key) || key.startsWith(INTERNAL_PREFIX);
}

function toMeta(object: R2Object, key: string): StorageItemMeta {
	return {
		path: key,
		size: object.size,
		contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
		etag: object.etag,
		lastModified: object.uploaded,
		...(object.customMetadata !== undefined && Object.keys(object.customMetadata).length > 0
			? { metadata: object.customMetadata }
			: {}),
	};
}

function toR2Body(body: BodyInput): ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob {
	return body;
}

function encodeKey(key: string) {
	return key.split("/").map(encodeURIComponent).join("/");
}

async function copyObject(
	binding: R2Bucket,
	fromLocation: Location,
	fromKey: string,
	toLocation: Location,
	toKey: string,
	signal?: AbortSignal,
) {
	checkSignal(signal);

	const source = await binding.get(toActualKey(fromLocation, fromKey));
	if (source === null) throw notFound(fromKey);

	checkSignal(signal);
	await binding.put(toActualKey(toLocation, toKey), source.body, putOptionsFromObject(source));
}

async function copyAllObjects(
	binding: R2Bucket,
	from: Location,
	to: Location,
	opts: {
		signal?: AbortSignal;
		onProgress?: (event: { copied: number; total: number }) => void;
	} = {},
) {
	const objects = await listLocationObjects(binding, from, opts.signal);
	let copied = 0;

	for (const object of objects) {
		checkSignal(opts.signal);
		await copyObject(binding, from, object.key, to, object.key, opts.signal);
		copied++;
		opts.onProgress?.({ copied, total: objects.length });
	}
}

async function listLocationObjects(binding: R2Bucket, location: Location, signal?: AbortSignal) {
	const objects: { key: string }[] = [];
	let cursor: string | undefined;

	do {
		checkSignal(signal);
		const page = await binding.list({
			prefix: location.prefix,
			...(cursor !== undefined ? { cursor } : {}),
		});

		for (const object of page.objects) {
			const key = toLogicalKey(location, object.key);
			if (!isReservedKey(key)) objects.push({ key });
		}

		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor !== undefined);

	return objects;
}

async function clearLocation(binding: R2Bucket, location: Location) {
	let cursor: string | undefined;
	const keys: string[] = [];

	do {
		const page = await binding.list({
			prefix: location.prefix,
			...(cursor !== undefined ? { cursor } : {}),
		});

		keys.push(...page.objects.map((object) => object.key));
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor !== undefined);

	for (let index = 0; index < keys.length; index += 1000) {
		await binding.delete(keys.slice(index, index + 1000));
	}
}

async function locationExists(binding: R2Bucket, location: Location) {
	const page = await binding.list({ prefix: location.prefix, limit: 1 });
	return page.objects.length > 0;
}

function putOptionsFromObject(object: R2Object): R2PutOptions {
	return {
		...(object.httpMetadata !== undefined ? { httpMetadata: object.httpMetadata } : {}),
		...(object.customMetadata !== undefined ? { customMetadata: object.customMetadata } : {}),
	};
}

function notFound(key: string) {
	return new StorageError({ code: "NotFound", message: `${key} not found` });
}

function asStorageError(err: unknown) {
	if (err instanceof StorageError) return err;

	const cause = err instanceof Error ? err : undefined;
	if (isAbortError(err)) return new StorageError({ code: "Aborted", cause });

	const r2 = err as Partial<R2Error> | undefined;
	const name = r2?.name;
	const code = r2?.code;

	if (name === "NotFound" || code === 404) return new StorageError({ code: "NotFound", cause });
	if (name === "Conflict" || code === 409) return new StorageError({ code: "Conflict", cause });
	if (code === 401 || code === 403) return new StorageError({ code: "Unauthorized", cause });
	if (typeof code === "number" && code >= 400 && code < 500) {
		return new StorageError({ code: "InvalidArgument", cause });
	}

	return new StorageError({ code: "Provider", cause });
}
