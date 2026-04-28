import type { ReactNode } from "react";

export const Container = ({ children, maxWidth }: { children: ReactNode; maxWidth?: number }) => {
	return (
		<div className="px-4">
			<div className="flex justify-center">
				<div className="w-full" style={{ maxWidth }}>
					{children}
				</div>
			</div>
		</div>
	);
};
