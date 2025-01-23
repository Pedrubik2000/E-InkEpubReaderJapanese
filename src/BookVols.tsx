import { openDB } from "idb";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Link } from "react-router";
import "./BooksFolders.css";
export function BookVols() {
	const params = useParams();
	const [bookFolders, setBookFolders] = useState<JSX.Element[] | JSX.Element>(
		<div />,
	);
	useEffect(() => {
		const fetchBookFolder = async () => {
			const db = await openDB("eInkReader", 1);
			const vols = await db.getAll("Books");
			const volsWithSerie = vols.filter((vol) => {
				return vol.folder === params.folder;
			});
			const volsOrdered = volsWithSerie.sort((a, b) => {
				a.volNumber - b.volNumber;
			});
			const cards = volsOrdered.map((vol) => {
				return (
					<div key={`divKeyBookFolder${vol.volId}`} className="BookFolder">
						<Link to={`${vol.volNumber}/${vol.currentSectionIndex}`}>
							<img
								key={`imgKey${vol.volId}`}
								src={URL.createObjectURL(vol.coverBlob)}
								alt={vol.volId}
							/>
						</Link>
					</div>
				);
			}) ?? <div />;
			setBookFolders(cards);
		};
		fetchBookFolder();
	}, [params]);
	return <div className="BooksFolders">{bookFolders}</div>;
}
