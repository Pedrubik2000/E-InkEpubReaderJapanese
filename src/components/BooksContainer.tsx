import { openDB } from "idb";
import { useEffect, useState } from "react";
import { CoverCard } from "./CoverCard";
import { useParams } from "react-router";
import { startIDB } from "../utils/epubIDB";
export function BooksContainer() {
	const [books, setBooks] = useState();
	const { folder } = useParams();
	console.log({ folder });
	useEffect(() => {
		(async () => {
			const db = await startIDB();
			const booksFromIndex = await db.getAllFromIndex("books", "folder");
			console.log({ booksFromIndex });
			const booksWithTitle = booksFromIndex.filter(
				(book) => book.folder === folder,
			);
			console.log({ booksWithTitle });
			setBooks(booksWithTitle);
		})();
	}, []);

	return (
		<div className="cardsContainer">
			{books &&
				books.map((book) => (
					<CoverCard
						key={book.id}
						linkTo={`book/${book.title}/section/${book.currentSection}`}
						text={book.title}
						blob={book.coverImageBlob}
					/>
				))}
		</div>
	);
}
