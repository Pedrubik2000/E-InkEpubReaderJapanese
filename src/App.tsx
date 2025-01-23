import "remixicon/fonts/remixicon.css";
import { UploadButton } from "./UploadButton";
import { Outlet } from "react-router";
import { openDB } from "idb";
import { useEffect } from "react";

function Toolbar() {
	return (
		<div style={{ borderStyle: "solid" }} className="Toolbar">
			<UploadButton />
		</div>
	);
}

function App() {
	useEffect(() => {
		const createDataBase = async () => {
			const db = await openDB("eInkReader", 1, {
				upgrade(db) {
					// Create a store of objects
					db.createObjectStore("Folders", {
						// The 'id' property of the object will be the key.
						keyPath: "id",
						// If it isn't explicitly set, create a value by auto incrementing.
					});
					db.createObjectStore("Books", {
						keyPath: "id",
					});
				},
			});
		};
		createDataBase();
		console.log("Creating Database");
	});
	return (
		<>
			<Toolbar />
			<Outlet />
		</>
	);
}

export default App;
