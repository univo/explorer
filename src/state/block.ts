export interface Block {
	number: number;
}

export async function getBlock(number: number): Promise<Block> {
	return {
		number,
	};
}
