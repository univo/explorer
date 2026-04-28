export interface Tx {
	hash: `0x${string}`;
}

export async function getTx(hash: `0x${string}`): Promise<Tx> {
	return {
		hash,
	};
}
