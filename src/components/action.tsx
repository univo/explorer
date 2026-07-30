import clsx from "clsx";
import type { ReactNode } from "react";

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
	| "cancelled"
	| "blacklisted";

type Color =
	| "yellow" //
	| "purple"
	| "gray"
	| "green"
	| "red"
	| "pink"
	| "blue"
	| "gold";

const colors: Record<Action, Color> = {
	sent: "yellow",
	received: "yellow",

	approved: "green",

	registered: "blue",

	burnt: "red",
	bridged: "red",
	cancelled: "red",
	revoked: "red",
	blacklisted: "red",

	won: "gold",

	bought: "purple",
	minted: "purple",
	deployed: "purple",
	deposited: "purple",

	sold: "gray",
};

const classes: Record<Color, string> = {
	red: "bg-red-100 text-red-800",
	blue: "bg-blue-100 text-blue-800",
	gray: "bg-gray-100 text-gray-600",
	pink: "bg-pink-100 text-pink-700",
	gold: "bg-amber-100 text-amber-800",
	green: "bg-green-100 text-green-800",
	purple: "bg-purple-100 text-purple-700",
	yellow: "bg-yellow-100 text-yellow-800",
};

export function Action(props: { type: Action; children: ReactNode }) {
	const color = colors[props.type];
	const className = classes[color];

	return <span className={clsx(className, "px-1 rounded")}>{props.children}</span>;
}
