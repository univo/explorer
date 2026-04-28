import { capitalize, formatRelativeDate } from "@/utils";

// function useRerender(ms = 1000) {
// 	const [, increment] = useReducer((state) => state + 1, 0);

// 	useEffect(() => {
// 		const id = setInterval(increment, ms);
// 		return () => clearInterval(id);
// 	}, [ms]);
// }

export function RelativeTimestamp({ timestamp }: { timestamp: Date }) {
	return capitalize(formatRelativeDate(timestamp));
}
