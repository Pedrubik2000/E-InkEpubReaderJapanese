import React, { useState } from "react";
import { getBookObject } from "./utils/epub";

function UploadButton() {
	const [fileContent, setFileContent] = useState<string | null>(null);
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const book = await getBookObject(file);

			setFileContent(book.html);
		}
	};
	return (
		<div>
			<input type="file" accept=".epub" onChange={handleFileUpload} />
			{fileContent && <div dangerouslySetInnerHTML={{ __html: fileContent }} />}
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
