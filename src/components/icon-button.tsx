import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type IconButtonProps = ComponentProps<"button"> & {
	href?: string;
	children: ReactNode;
};

export function IconButton(props: IconButtonProps) {
	const className = clsx(
		"inline-flex items-center rounded-md shrink-0 p-1.5 text-gray-400 cursor-pointer",
		"hover:text-gray-500 hover:bg-gray-100",
		"disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75",
	);

	if (props.href) {
		return (
			<a target="_blank" rel="noopener noreferrer" href={props.href} className={className}>
				{props.children}
			</a>
		);
	}

	return (
		<button type="button" className={className} {...props}>
			{props.children}
		</button>
	);
}
