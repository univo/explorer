import clsx from "clsx";

type Action =
	| "won"
	| "sent"
	| "received"
	| "sold"
	| "bought"
	| "approved"
	| "revoked"
	| "minted"
	| "burnt"
	| "registered"
	| "bridged"
	| "deployed"
	| "deposited"
	| "supplied"
	| "withdrew"
	| "borrowed"
	| "repaid"
	| "swapped"
	| "cancelled"
	| "blacklisted";

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
	sent: "gray",
	received: "gray",

	approved: "green",
	registered: "green",

	burnt: "red",
	cancelled: "red",
	revoked: "red",
	blacklisted: "red",

	won: "gold",

	bought: "purple",
	minted: "purple",
	deployed: "purple",
	deposited: "purple",
	supplied: "purple",
	borrowed: "purple",

	swapped: "blue",

	sold: "orange",
	repaid: "orange",
	bridged: "orange",
	withdrew: "orange",
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
