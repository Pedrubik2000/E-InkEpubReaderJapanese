import { useState, useEffect, useRef } from "react";
import { getBookObject } from "./utils/epub";
import type { Book } from "./utils/epub";
import "remixicon/fonts/remixicon.css";
import { DialogForm } from "./DialogForm";
import { BooksFolders } from "./BooksFolders";

function UploadButton() {
	const [bookContent, setBookTitleContent] = useState<Book | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const book = await getBookObject(file);
			setBookTitleContent(book);
			setIsDialogOpen(true);
		}
	};
	return (
		<div className="UploadButton">
			<label htmlFor="file-upload" style={{ cursor: "pointer" }}>
				<i
					className="ri-file-upload-fill"
					style={{ fontSize: "48px", color: "#000000" }}
				/>
			</label>
			<input
				id="file-upload"
				type="file"
				accept=".epub"
				onChange={handleFileUpload}
				style={{ display: "none" }}
			/>
			{bookContent && (
				<DialogForm
					book={bookContent}
					isOpen={isDialogOpen}
					onClose={() => setIsDialogOpen(false)}
				/>
			)}
		</div>
	);
}
function Toolbar() {
	return (
		<div style={{ borderStyle: "solid" }} className="Toolbar">
			<UploadButton />
		</div>
	);
}

function App() {
	return (
		<>
			<Toolbar />
			<BooksFolders />
		</>
	);
}

export default App;
