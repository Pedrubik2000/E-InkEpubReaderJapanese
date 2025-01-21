import "remixicon/fonts/remixicon.css";
import { UploadButton } from "./UploadButton";
import { Outlet } from "react-router";

function Toolbar() {
	return (
		<div style={{ borderStyle: "solid" }} className="Toolbar">
			<UploadButton />
		</div>
	);
}

function App() {
	return (
		<>
			<Toolbar />
			<Outlet />
		</>
	);
}

export default App;
