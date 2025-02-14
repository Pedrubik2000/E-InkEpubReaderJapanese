import { useRef, useState, useEffect } from "react";
import type React from "react";
import type { BookData } from "../utils/epub";
import { uploadEpubToIDB } from "../utils/epubIDB";
import { startIDB } from "../utils/epubIDB";

export function DialogForm({
	stateChanger,
	bookData,
}: {
	stateChanger: React.Dispatch<React.SetStateAction<boolean>>;
	bookData: BookData;
}) {
	const [image, setImage] = useState(
		bookData.embeddedImages.filter((embeddedImage) => {
			return embeddedImage.fileName.includes("cover");
		})[0],
	);
	const [folders, setFolders] = useState<string[]>([]);
	useEffect(() => {
		(async () => {
			const database = await startIDB();
			setFolders(await database.getAllKeysFromIndex("folders", "folder"));
			console.log(await database.getAllKeysFromIndex("folders", "folder"));
		})();
	}, []);
	function closeDialog() {
		stateChanger(false);
	}
	function submitDialog(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const elements = event.currentTarget.elements;
		const title = elements.title.value;
		const folder = elements.folder.value;
		const volumenNumber = elements.volumenNumber.value;
		const coverImage = elements.coverImage.value;
		const coverImageBlob = bookData.embeddedImages.filter(
			(embeddedImage) => embeddedImage.fileName === coverImage,
		)[0].dataBlob;
		(async () =>
			await uploadEpubToIDB(
				folder,
				title,
				volumenNumber,
				coverImageBlob,
				bookData,
			))();
		console.log(bookData);
		console.log({ title, folder, volumenNumber, coverImage });
		closeDialog();
	}
	function changeImage(event: React.ChangeEvent<HTMLSelectElement>) {
		const embeddedImage = bookData.embeddedImages.filter((embeddedImage) => {
			return embeddedImage.fileName === event.target.value;
		});
		setImage(embeddedImage[0]);
	}
	return (
		<dialog className="dialogForm" open>
			<form method="dialog" onSubmit={submitDialog}>
				<label htmlFor="title">Title:</label>
				<input type="text" name="title" list="titles" autoComplete="off" />
				<label htmlFor="folder">Folder:</label>
				<input type="text" name="folder" list="folders" autoComplete="off" />
				<datalist id="titles">
					<option>{bookData.bookTitle}</option>
					<option>{bookData.alternativeTitle}</option>
				</datalist>
				<datalist id="folders">
					<option>{bookData.bookTitle}</option>
					<option>{bookData.alternativeTitle}</option>
					{folders.length >= 1 &&
						folders.map((folderString) => (
							<option key={folderString}>{folderString}</option>
						))}
				</datalist>
				<label htmlFor="volumenNumber">Volumen:</label>
				<input type="number" name="volumenNumber" defaultValue={1} />
				<label htmlFor="coverImage">Cover:</label>
				<select name="coverImage" onChange={(e) => changeImage(e)}>
					{bookData.embeddedImages.map((embeddedImage) => {
						if (embeddedImage.fileName.includes("cover")) {
							return (
								<option
									value={embeddedImage.fileName}
									key={embeddedImage.fileName}
								>
									{embeddedImage.fileName}
								</option>
							);
						}
					})}
				</select>
				{image && (
					<div className="imgWrapper">
						<img
							src={URL.createObjectURL(image.dataBlob)}
							alt={image.fileName}
						/>
					</div>
				)}

				<button type="button" onClick={closeDialog}>
					Close
				</button>
				<button type="submit">Submit</button>
			</form>
		</dialog>
	);
}
