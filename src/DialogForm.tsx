import { useEffect, useRef, useState } from "react";
import { openDB, deleteDB, wrap, unwrap } from "idb";
import type { Book } from "./utils/epub";
import type { DBSchema } from "idb";
import "./DialogForm.css";

interface MyDB extends DBSchema {
	[title: string]: {
		key: string;
		value: number;
		series: string[];
	};
}

export function DialogForm({
	book,
	isOpen,
	onClose,
}: { book: Book; isOpen: boolean; onClose: () => void }) {
	const [blobUrl, setBlobUrl] = useState("");
	const [blobUrlName, setBlobUrlName] = useState("");
	const [selectItems, setSelectItems] = useState<JSX.Element[]>([]);
	const dialogRef = useRef<HTMLDialogElement | null>(null);

	// Open or close the dialog when `isOpen` changes
	useEffect(() => {
		if (isOpen) {
			dialogRef.current?.showModal();
		} else {
			dialogRef.current?.close();
		}
	}, [isOpen]);
	useEffect(() => {
		// Convert the Blob to a URL

		const coverBlobs = book.blobs.filter((blob) => {
			return blob.name.includes("cover");
		});
		const objectUrl = URL.createObjectURL(coverBlobs[0].blob);
		setBlobUrl(objectUrl);
		setBlobUrlName(coverBlobs[0].name);

		const listItems = coverBlobs.map((blob) => {
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
	async function search(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const series = formData.get("altTitle") as string;
		const title = formData.get("title") as string;
		const volNumber = formData.get("volNumber") as string;
		const volId = `${title}${volNumber}`;
		const selectCover = formData.get("coverImages");
		const coverBlob = (() => {
			for (const blob of book.blobs) {
				if (blob.name === selectCover) {
					return blob.blob;
				}
			}
			return "";
		})();
		try {
			const db = await openDB("einkreader", 1, {
				upgrade(db) {
					// Create a store of objects
					const seriesStore = db.createObjectStore("series", {
						// The 'id' property of the object will be the key.
						keyPath: "id",
						// If it isn't explicitly set, create a value by auto incrementing.
						autoIncrement: true,
					});
					// Create an index on the 'date' property of the objects.
					seriesStore.createIndex("title", "title", { unique: false });
					seriesStore.createIndex("updatedAt", "updatedAt", { unique: false });
					// Create Volumes store
					const volumeStore = db.createObjectStore("Volumes", {
						keyPath: "id",
					});
					volumeStore.createIndex("seriesId", "seriesId", { unique: false });
					volumeStore.createIndex("title", "title", { unique: false });
				},
			});
			await db.add("Volumes", {
				id: volId,
				title: title,
				vol: volNumber,
				coverBlob: coverBlob,
				blobs: book.blobs,
				html: book.html,
			});
			await db.add("series", {
				series: series,
				updatedAt: new Date(),
				currentCoverBlob: coverBlob,
			});
		} catch (error) {
			console.error("Error:", error);
		}
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
		<dialog ref={dialogRef}>
			<form onSubmit={search}>
				<div className="InputDialog">
					<label htmlFor="title">Titulo: </label>
					<input
						type="text"
						name="title"
						id="title"
						defaultValue={book.title}
					/>
					<label htmlFor="altTitle">Folder: </label>
					<input
						type="text"
						name="altTitle"
						id="altTitle"
						defaultValue={book.altTitle}
					/>
					<label htmlFor="volNumber">Numero de Volumen:</label>
					<input
						type="number"
						name="volNumber"
						id="volNumber"
						defaultValue="1"
					/>
					<label htmlFor="coverImages">Escoge imagen del cover:</label>
					<select
						defaultValue={blobUrlName}
						name="coverImages"
						id="coverImages"
						onChange={changeImage}
					>
						{selectItems}
					</select>
				</div>
				<div className="ImageDialog">
					<img src={blobUrl} alt={blobUrlName} />
				</div>
				<div className="ButtonsDialog">
					<button type="button" onClick={onClose}>
						Cerrar
					</button>
					<button type="submit">Subir</button>
				</div>
			</form>
		</dialog>
	);
}
