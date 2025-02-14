import { openDB } from "idb";
import { useEffect, useState } from "react";
import { CoverCard } from "./CoverCard";
import { startIDB } from "../utils/epubIDB";
export function FoldersContainer() {
	const [folders, setFolders] = useState();
	useEffect(() => {
		(async () => {
			const db = await startIDB();
			const foldersFromIndex = await db.getAllFromIndex("folders", "folder");
			setFolders(foldersFromIndex);
		})();
	}, []);

	return (
		<div className="cardsContainer">
			{folders &&
				folders.map((folder) => (
					<CoverCard
						linkTo={`folder/${folder.folder}`}
						key={folder.folder}
						text={folder.folder}
						blob={folder.coverImageBlob}
					/>
				))}
		</div>
	);
}
