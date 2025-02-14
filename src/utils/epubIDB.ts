import { openDB } from "idb";
import type { BookData, EmbeddedImage } from "./epub";
export async function startIDB() {
	const db = await openDB("epubReaderEInk", 1, {
		upgrade(db) {
			const foldersStore = db.createObjectStore("folders", { keyPath: "id" });
			foldersStore.createIndex("folder", "folder");
			foldersStore.createIndex("updatedAt", "updatedAt");
			const booksStore = db.createObjectStore("books", { keyPath: "id" });
			booksStore.createIndex("title", "title");
			booksStore.createIndex("folder", "folder");
		},
	});
	return db;
}
export async function uploadEpubToIDB(
	folder: string,
	title: string,
	volumenNumber: number,
	coverImageBlob: Blob,
	bookData: BookData,
) {
	const db = await startIDB();
	await db.put("folders", {
		id: folder,
		folder,
		coverImageBlob,
		updatedAt: Date.now(),
	});
	await db.put("books", {
		id: `${folder}${volumenNumber}`,
		title,
		coverImageBlob,
		folder,
		totalCharacterCount: bookData.totalCharacterCount,
		embeddedImages: bookData.embeddedImages,
		sections: bookData.sections,
		currentSection: 0,
		currentIndex: 0,
		tableOfContents: bookData.tableOfContents,
		globalStyles: bookData.globalStyles,
	});
	const bookDataRaw = await db.getFromIndex("books", "title", title);
	const sections = bookDataRaw.sections;
	const embeddedImagesBlobURL = await Promise.all(
		bookDataRaw.embeddedImages.map(async (embeddedImage: EmbeddedImage) => {
			const fileReader = new FileReader();

			// Create a promise that resolves when the FileReader's load event fires
			const blobURL = await new Promise((resolve, reject) => {
				fileReader.onload = () => resolve(fileReader.result);
				fileReader.onerror = () => reject(fileReader.error);
				fileReader.readAsDataURL(embeddedImage.dataBlob);
			});

			console.log({ blobURL });
			const fileNameSplitted = embeddedImage.fileName.split("/");
			const fileName =
				fileNameSplitted[fileNameSplitted.length - 1] ?? embeddedImage.fileName;
			return { fileName, blobURL };
		}),
	);

	console.log(embeddedImagesBlobURL);
	for (const section of sections) {
		for (const embeddedImageBlobURL of embeddedImagesBlobURL) {
			const fileName = embeddedImageBlobURL.fileName;
			const blobURL = embeddedImageBlobURL.blobURL;
			const RegExpression = new RegExp(
				`(?<=src=")(.*?${fileName}.*?)(?=")|(?<=href=")(.*?${fileName}.*?)(?=")`,
				"gm",
			);
			console.log({ fileName, blobURL, RegExpression });
			section.htmlContent = section.htmlContent.replace(RegExpression, blobURL);
		}
	}
	await db.put("books", {
		id: `${folder}${volumenNumber}`,
		title,
		coverImageBlob,
		folder,
		totalCharacterCount: bookData.totalCharacterCount,
		embeddedImages: bookData.embeddedImages,
		sections: bookDataRaw.sections,
		currentSection: 0,
		currentIndex: { current: 0, start: 0, end: 0 },
		tableOfContents: bookData.tableOfContents,
		globalStyles: bookData.globalStyles,
	});
}
