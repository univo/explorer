export function Kbd(props: { children: string }) {
	return <kbd className="bg-white rounded ring-1 ring-black/5 px-0.5 py-px text-xs">{props.children}</kbd>;
}
