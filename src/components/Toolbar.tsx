import type { ReactNode } from "react";

interface ToolbarProps {
	children: ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
	return <div className="Toolbar">{children}</div>;
}
