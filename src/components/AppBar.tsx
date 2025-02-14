import type { ReactNode } from "react";

interface AppBarProps {
	children: ReactNode;
}

export function AppBar({ children }: AppBarProps) {
	return <header className="AppBar">{children}</header>;
}
