import type { ReactNode } from "react";

export function Table(props: { children?: ReactNode }) {
	return <table className="w-full relative">{props.children}</table>;
}

export function TableHead(props: { children?: ReactNode; className?: string }) {
	return (
		<thead className={props.className}>
			<tr>{props.children}</tr>
		</thead>
	);
}

export function TableHeading(props: { children?: ReactNode }) {
	return <th className="px-3 py-1.5 bg-gray-100">{props.children}</th>;
}

export function TableBody(props: { children?: ReactNode }) {
	return <tbody className="divide-y divide-gray-200 overflow-hidden">{props.children}</tbody>;
}

export function TableRow(props: { children?: ReactNode }) {
	return <tr className="overflow-hidden">{props.children}</tr>;
}

export function TableData(props: { children?: ReactNode }) {
	return <td className="px-3 py-1.5 overflow-hidden">{props.children}</td>;
}
