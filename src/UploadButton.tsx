import { useState } from "react";
import { getBookData } from "./utils/epub";
import type { BookData } from "./utils/epub";
import { DialogForm } from "./DialogForm";

export function UploadButton() {
	const [bookContent, setBookTitleContent] = useState<BookData | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const book = await getBookData(file);
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
