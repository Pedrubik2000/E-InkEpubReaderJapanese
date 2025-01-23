import { openDB } from "idb";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import "./BooksFolders.css";
export function BooksFolders() {
	const [bookFolders, setBookFolders] = useState<JSX.Element[] | JSX.Element>(
		<div />,
	);
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
		const fetchBookFolder = async () => {
			const db = await openDB("eInkReader", 1);
			const folders = await db.getAll("Folders");
			const cards = folders.map((folder) => {
				console.log({ folder });
				return (
					<div key={folder.series} className="BookFolder">
						<Link to={`folder/${folder.series}`}>
							<img
								src={URL.createObjectURL(folder.currentCoverBlob)}
								alt={folder.series}
							/>
						</Link>
					</div>
				);
			}) ?? <div />;
			setBookFolders(cards);
		};
		fetchBookFolder();
	}, []);
	return <div className="BooksFolders">{bookFolders}</div>;
}
