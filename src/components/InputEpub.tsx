import { getBookData } from "../utils/epub";
import type React from "react";
import { createPortal } from "react-dom";
import { DialogForm } from "./DialogForm";
import { BookData } from "../utils/epub";
import { useState, useRef } from "react";
export function InputEpub() {
	const bookDataRef = useRef<BookData>();
	const [isOpen, setIsOpen] = useState(false);
	async function epubHandle(e: React.ChangeEvent<HTMLInputElement>) {
		const rawEpubFile = e.currentTarget.files[0];
		if (rawEpubFile) {
			const bookData = await getBookData(rawEpubFile);
			setIsOpen(true);
			bookDataRef.current = bookData;
			return bookData;
		}
	}
	return (
		<div className="inputEpub">
			<label htmlFor="inputEpub">📄</label>
			<input
				type="file"
				id="inputEpub"
				name="inputEpub"
				accept=".epub"
				style={{ display: "none" }}
				onChange={async (e) => console.log({ eFiles: await epubHandle(e) })}
			/>
			{isOpen &&
				createPortal(
					<DialogForm
						stateChanger={setIsOpen}
						bookData={bookDataRef.current}
					/>,
					document.body,
				)}
		</div>
	);
}
