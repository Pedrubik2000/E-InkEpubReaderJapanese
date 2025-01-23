import { openDB } from "idb";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

export function BookSection() {
	const [htmlContent, setHtmlContent] = useState("");
	const { folder, volNumber, sectionIndex } = useParams();
	const navigate = useNavigate();
	const currentIndex = parseInt(sectionIndex);
	useEffect(() => {
		async function getHTML() {
			const db = await openDB("eInkReader", 1);
			const bookData = await db.get("Books", `${folder}${volNumber}`);
			let htmlContent = bookData.sections[sectionIndex].htmlContent;
			const embeddedImages = bookData.embeddedImages;
			for (const embeddedImage of embeddedImages) {
				console.log({ embeddedImage });
				console.log(embeddedImage.fileName);
				const embeddedImageSplitted = embeddedImage.fileName.split("/");
				const objectURL = URL.createObjectURL(embeddedImage.dataBlob);
				const fileName =
					embeddedImageSplitted[embeddedImageSplitted.length - 1];
				const RegExpression = new RegExp(
					`(?<=src=")(.*?${fileName}.*?)(?=")|(?<=href=")(.*?${fileName}.*?)(?=")`,
					"gm",
				);
				console.log({ RegExpression });
				console.log({ embeddedImage });
				htmlContent = htmlContent.replace(RegExpression, objectURL);
				const globalStyles = bookData.globalStyles;
				if (globalStyles) {
					const styleElement = document.createElement("style");
					styleElement.textContent = globalStyles;
					document.head.appendChild(styleElement);
				}
				console.log(htmlContent);
			}
			setHtmlContent(htmlContent);
		}
		getHTML();
	}, [folder, volNumber, sectionIndex]);
	const handleNext = () => {
		navigate(`/folder/${folder}/${volNumber}/${currentIndex + 1}`);
	};

	const handlePrevious = () => {
		if (currentIndex > 0) {
			navigate(`/folder/${folder}/${volNumber}/${currentIndex - 1}`);
		}
	};
	return (
		<>
			<div
				className="einkwrapper"
				dangerouslySetInnerHTML={{ __html: htmlContent }}
			/>
			<div className="navigation-buttons">
				<button onClick={handlePrevious} disabled={currentIndex === 0}>
					Previous
				</button>
				<button onClick={handleNext}>Next</button>
			</div>
		</>
	);
}
