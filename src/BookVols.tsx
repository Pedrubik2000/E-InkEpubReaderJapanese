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
			const db = await openDB("einkreader", 1);
			const vols = await db.getAll("Volumes");
			const volsWithSerie = vols.filter((vol) => {
				return vol.folder === params.book;
			});
			const volsOrdered = volsWithSerie.sort((a, b) => {
				a.vol - b.vol;
			});
			const cards = volsOrdered.map((vol) => {
				return (
					<div key={vol.volId} className="BookFolder">
						<Link to={`vol/${vol.title}`}>
							<img src={URL.createObjectURL(vol.coverBlob)} alt={vol.volId} />
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
