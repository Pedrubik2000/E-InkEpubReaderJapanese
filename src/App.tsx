import { useState, useEffect } from "react";
import { getBookObject } from "./utils/epub";
import type { Book } from "./utils/epub";
function DialogForm({ book }: { book: Book }) {
	const [blobUrl, setBlobUrl] = useState("");
	const [blobUrlName, setBlobUrlName] = useState("");
	const [selectItems, setSelectItems] = useState<JSX.Element[]>([]);
	useEffect(() => {
		// Convert the Blob to a URL

		const coverBlobs = book.blobs.filter((blob) => {
			return blob.name.includes("cover");
		});
		const objectUrl = URL.createObjectURL(coverBlobs[0].blob);
		setBlobUrl(objectUrl);
		setBlobUrlName(coverBlobs[0].name);

		const listItems = coverBlobs.map((blob) => {
			if (blob.name === coverBlobs[0].name) {
				return (
					<option key={blob.name} value={blob.name} selected>
						{blob.name}
					</option>
				);
			}
			return (
				<option key={blob.name} value={blob.name}>
					{blob.name}
				</option>
			);
		});
		setSelectItems(listItems);
		// Clean up the object URL after the component unmounts
		return () => {
			URL.revokeObjectURL(objectUrl);
		};
	}, [book]);
	function search(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
	}
	function changeImage(event: React.ChangeEvent<HTMLSelectElement>) {
		const selectedBlob = book.blobs.find(
			(blob) => blob.name === event.target.value,
		);
		if (selectedBlob) {
			const objectUrl = URL.createObjectURL(selectedBlob.blob);
			setBlobUrl(objectUrl);
		}
	}

	return (
		<form onSubmit={search}>
			<label htmlFor="title">Titulo: </label>
			<input type="text" name="title" id="title" value={book.title} />
			<label htmlFor="altTitle">Titulo Alternativo: </label>
			<input type="text" name="altTitle" id="altTitle" value={book.altTitle} />
			<label htmlFor="creator">Creador/Creadores: </label>
			<input
				type="text"
				name="creator"
				id="creator"
				value={book.creator.toString()}
			/>
			<label htmlFor="identifier">Identificador: </label>
			<input
				type="text"
				name="identifier"
				id="identifier"
				value={book.identifier}
			/>
			<label htmlFor="language">Lenguaje: </label>
			<input type="text" name="language" id="language" value={book.language} />
			<label htmlFor="date">Fecha: </label>
			<input type="text" name="date" id="date" value={book.date} />
			<label htmlFor="publisher">Editorial: </label>
			<input
				type="text"
				name="publisher"
				id="publisher"
				value={book.publisher}
			/>
			<label htmlFor="readingDirection">Direccion de Lectura: </label>
			<input
				type="text"
				name="readingDirection"
				id="readingDirection"
				value={book.pageDirection || book.readingDirection || "ltr"}
			/>
			<select onChange={changeImage}>{selectItems}</select>
			<img src={blobUrl} alt={blobUrlName} />
			<button type="submit">Subir</button>
		</form>
	);
}
function UploadButton() {
	const [bookContent, setBookTitleContent] = useState<Book | null>(null);
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const book = await getBookObject(file);
			setBookTitleContent(book);
		}
	};
	return (
		<div className="UploadButton">
			<input type="file" accept=".epub" onChange={handleFileUpload} />
			<p>{bookContent?.title || "No title available"}</p>
			{bookContent ? <DialogForm book={bookContent} /> : ""}
		</div>
	);
}
function Toolbar() {
	return (
		<div className="Toolbar">
			<UploadButton />
		</div>
	);
}

function App() {
	return (
		<>
			<Toolbar />
		</>
	);
}

export default App;
