import { Outlet } from "react-router";
import { AppBar } from "./components/AppBar";
import { Toolbar } from "./components/Toolbar";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { InputEpub } from "./components/InputEpub";
export function App() {
	return (
		<>
			<AppBar>
				<Toolbar>
					<Breadcrumbs />
					<InputEpub />
				</Toolbar>
			</AppBar>
			<Outlet />
		</>
	);
}
