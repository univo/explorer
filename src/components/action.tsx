import clsx from "clsx";

type Action =
	| "win"
	| "lose"
	| "send"
	| "receive"
	| "sell"
	| "buy"
	| "approve"
	| "revoke"
	| "mint"
	| "burn"
	| "register"
	| "bridge"
	| "deploy"
	| "deposit"
	| "supply"
	| "withdraw"
	| "borrow"
	| "repay"
	| "swap"
	| "cancel"
	| "blacklist";

type Color =
	| "purple" //
	| "gray"
	| "green"
	| "red"
	| "pink"
	| "blue"
	| "gold"
	| "orange";

const colors: Record<Action, Color> = {
	send: "gray",
	receive: "gray",

	buy: "green",
	approve: "green",
	register: "green",

	lose: "red",
	burn: "red",
	cancel: "red",
	revoke: "red",
	blacklist: "red",

	win: "gold",

	mint: "purple",
	deploy: "purple",
	deposit: "purple",
	supply: "purple",
	borrow: "purple",

	swap: "blue",

	sell: "orange",
	repay: "orange",
	bridge: "orange",
	withdraw: "orange",
};

const classes: Record<Color, string> = {
	red: "bg-red-100 text-red-800",
	blue: "bg-blue-100 text-blue-800",
	gray: "bg-gray-100 text-gray-600",
	pink: "bg-pink-100 text-pink-700",
	gold: "bg-amber-100 text-amber-800",
	green: "bg-green-100 text-green-800",
	orange: "bg-orange-100 text-orange-800",
	purple: "bg-purple-100 text-purple-700",
};

export function Action(props: { type: Action; children: string }) {
	const color = colors[props.type];
	const className = classes[color];

	return <span className={clsx(className, "px-1 rounded")}>{props.children}</span>;
}
