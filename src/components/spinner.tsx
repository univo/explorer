import type { ComponentProps } from "react";

export function Spinner(props: ComponentProps<"svg">) {
	return (
		<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
			<g
				fill="none"
				strokeWidth="1.5"
				strokeLinecap="round"
				stroke="currentColor"
				className="animate-spin duration-1000 origin-center"
			>
				<circle strokeOpacity=".2" cx="8" cy="8" r="6" />

				<circle
					cx="8"
					cy="8"
					r="6"
					style={{ strokeDasharray: "38px", strokeDashoffset: "114px" }}
					className="text-gray-900 animate-[offset_2s_linear_0s_infinite_normal_none_running]"
				/>
			</g>
		</svg>
	);
}
