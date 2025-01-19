import React, { useState } from "react";
import JSZip from "jszip";

function UploadButton() {
	const [fileContent, setFileContent] = useState<string | null>(null);
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const zip = new JSZip();
			const zipContent = await zip.loadAsync(file);
			const fileNames: string[] = [];

			zipContent.forEach((relativePath) => {
				fileNames.push(relativePath);
			});

			setFileContent(fileNames.join("\n"));
		}
	};
	return (
		<div>
			<input type="file" accept=".epub" onChange={handleFileUpload} />
			<p>{fileContent || "No file uploaded"}</p>
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
