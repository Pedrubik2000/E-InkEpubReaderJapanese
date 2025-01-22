import { useEffect, useRef, useState } from "react";
import { openDB } from "idb";
import type { BookData } from "./utils/epub";
import "./DialogForm.css";

export function DialogForm({
	book,
	isOpen,
	onClose,
}: { book: BookData; isOpen: boolean; onClose: () => void }) {
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

		const coverBlobs = book.embeddedImages.filter((blob) => {
			return blob.fileName.includes("cover");
		});
		const objectUrl = URL.createObjectURL(coverBlobs[0].dataBlob);
		setBlobUrl(objectUrl);
		setBlobUrlName(coverBlobs[0].fileName);

		const listItems = coverBlobs.map((blob) => {
			return (
				<option key={blob.fileName} value={blob.fileName}>
					{blob.fileName}
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
		const volId = `${series}${volNumber}`;
		const selectCover = formData.get("coverImages");
		const coverBlob = (() => {
			for (const blob of book.embeddedImages) {
				if (blob.fileName === selectCover) {
					return blob.dataBlob;
				}
			}
			return "";
		})();
		try {
			const db = await openDB("einkreader", 1, {
				upgrade(db) {
					// Create a store of objects
					db.createObjectStore("series", {
						// The 'id' property of the object will be the key.
						keyPath: "id",
						// If it isn't explicitly set, create a value by auto incrementing.
					});
					db.createObjectStore("Volumes", {
						keyPath: "id",
					});
				},
			});
			await db.put("Volumes", {
				id: volId,
				title: title,
				folder: series,
				vol: volNumber,
				coverBlob: coverBlob,
				blobs: book.embeddedImages,
				html: book.sections,
			});
			await db.put("series", {
				id: series,
				series: series,
				updatedAt: new Date(),
				currentCoverBlob: coverBlob,
			});
		} catch (error) {
			console.error("Error:", error);
		}
	}
	function changeImage(event: React.ChangeEvent<HTMLSelectElement>) {
		const selectedBlob = book.embeddedImages.find(
			(blob) => blob.fileName === event.target.value,
		);
		if (selectedBlob) {
			const objectUrl = URL.createObjectURL(selectedBlob.dataBlob);
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
						defaultValue={book.bookTitle}
					/>
					<label htmlFor="altTitle">Folder: </label>
					<input
						type="text"
						name="altTitle"
						id="altTitle"
						defaultValue={book.alternativeTitle}
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
