import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import balanced from "balanced-match";

export interface BookSection {
	sourceFile: string;
	htmlContent: string;
	characterCount: number;
}
export interface TableOfContentsItem {
	targetFile: string;
	displayText: string;
	cumulativeCharacterCount: number;
}
export interface BookData {
	bookTitle: string;
	alternativeTitle: string;
	sections: BookSection[];
	tableOfContents: TableOfContentsItem[];
	globalStyles: string;
	embeddedImages: EmbeddedImage[];
	totalCharacterCount: number;
}
export interface EmbeddedImage {
	fileName: string;
	dataBlob: Blob;
}

async function parseHtmlFile(html: string): Promise<Partial<BookSection>> {
	const classValue = html.match(/<body\s+class="(.*?)">/)?.[1];
	const result = balanced(/<body.*?>/, "</body>", html) ?? {
		body: "",
	};
	const regexHref = /(?<=href=")(.+?)(?=#.*?")/gm;
	const finalResult = result.body.replace(regexHref, "");
	const characterCount = finalResult.replace(
		/<rt>.*?<\/rt>|<.*?>|\s/gm,
		"",
	).length;
	let htmlContent: string;
	if (classValue) {
		console.log(classValue);
		htmlContent = `<div class="${classValue}">${finalResult}</div>`;
	} else {
		htmlContent = `<div>${finalResult}</div>`;
	}
	return { htmlContent, characterCount };
}
async function parseOpfFile(opfContent: string): Promise<Partial<BookData>> {
	const options = {
		ignoreAttributes: false,
		attributeNamePrefix: "@_",
		allowBooleanAttributes: true,
		parseAttributeValue: true,
		processEntities: true, // To process special characters like &amp;, &lt; etc.
		removeNSPrefix: true, // Removes namespace prefixes (like dc:, opf:)
	};
	const parser = new XMLParser(options);

	const jobj = parser.parse(opfContent);

	const bookTitle =
		(() => {
			const meta = jobj.package.metadata.meta;
			if (Object.prototype.toString.call(meta) === "[object Array]") {
				for (const element of meta) {
					if (element["@_refines"] === "#title") {
						return element["#text"];
					}
				}
			}
			return jobj.package.metadata.title["#text"];
		})() ?? "";
	const alternativeTitle =
		(() => {
			const meta = jobj.package.metadata.meta;
			for (const element of meta) {
				if (element["@_property"] === "belongs-to-collection") {
					return element["#text"];
				}
			}
			return jobj.package.metadata.title["#text"];
		})() ?? "";

	return { bookTitle, alternativeTitle };
}
export async function getBookData(epubBuffer: Buffer | File) {
	const epubZip = new JSZip();
	const embeddedImages: EmbeddedImage[] = [];

	const bookData: BookData = {
		bookTitle: "",
		alternativeTitle: "",
		sections: [],
		tableOfContents: [],
		globalStyles: "",
		embeddedImages: [],
		totalCharacterCount: 0,
	};

	const epubZipContent = await epubZip.loadAsync(epubBuffer);
	const epubZipFiles = epubZipContent.files;

	let globalStyles = "";

	for (const [key, values] of Object.entries(epubZipFiles)) {
		if (key.includes(".opf")) {
			// console.log({ key, values });
			const data = await values.async("string");
			const opfData = await parseOpfFile(data);
			bookData.bookTitle = opfData.bookTitle ?? "";
			bookData.alternativeTitle = opfData.alternativeTitle ?? "";
			continue;
		}
		if (key.includes("nav") && key.includes("html")) {
			continue;
		}

		if (key.includes("html")) {
			const data = await values.async("string");
			const htmlData = await parseHtmlFile(data);
			bookData.totalCharacterCount += htmlData.characterCount ?? 0;
			bookData.sections.push({
				sourceFile: key,
				htmlContent: htmlData.htmlContent ?? "<div></div>",
				characterCount: htmlData.characterCount ?? 0,
			});
		}
		if (
			key.includes(".jpeg") ||
			key.includes(".jpg") ||
			key.includes(".svg") ||
			key.includes(".png")
		) {
			const data = await values.async("blob");
			const mimeType = key.includes(".png")
				? "image/png"
				: key.includes(".svg")
					? "image/svg+xml"
					: "image/jpeg";
			const blobWithType = new Blob([data], { type: mimeType });
			embeddedImages.push({
				fileName: key,
				dataBlob: blobWithType,
			});
		}
		if (key.includes(".css")) {
			//remove body.something
			//remove body{}
			const data = await values.async("string");
			globalStyles += data;
			globalStyles += "\n";
		}
	}
	bookData.globalStyles = globalStyles;
	bookData.embeddedImages = embeddedImages;
	return bookData;
}

import fs from "node:fs";
const epubFile = fs.readFileSync("/home/pedro/Downloads/danmachi v19.epub");
const book1 = await getBookData(epubFile);
console.log(book1);
