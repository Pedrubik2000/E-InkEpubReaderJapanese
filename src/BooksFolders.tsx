import { openDB } from "idb";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import "./BooksFolders.css";
export function BooksFolders() {
	const [bookFolders, setBookFolders] = useState<JSX.Element[] | JSX.Element>(
		<div />,
	);
	useEffect(() => {
		const fetchBookFolder = async () => {
			const db = await openDB("einkreader", 1);
			const folders = await db.getAll("series");
			const cards = folders.map((folder) => {
				return (
					<div key={folder.series} className="BookFolder">
						<Link to={`book/${folder.series}`}>
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