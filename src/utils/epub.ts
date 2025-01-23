import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import balanced from "balanced-match";

export interface BookSection {
	id: string;
	htmlContent: string;
	characterCount: number;
}
export interface TableOfContentsItem {
	id: string;
	displayText: string;
	cumulativeCharacterCount: number;
}
export interface BookData {
	bookTitle: string;
	alternativeTitle: string;
	sections: BookSection[];
	tableOfContents: TableOfContentsItem[];
	globalStyles: string;
	sectionsOrder: string[];
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
	const regexHref = /(?<=href=")(?=.+?)(#.*?")/gm;
	const finalResult = result.body.replace(regexHref, "");
	//Thanks ttusama
	const sanitizedHtmlForCharacterCount = finalResult
		.replace(/<rt>.*?<\/rt>|<.*?>|\s/gm, "")
		.replace(
			/[^0-9A-Z○◯々-〇〻ぁ-ゖゝ-ゞァ-ヺー０-９Ａ-Ｚｦ-ﾝ\p{Radical}\p{Unified_Ideograph}]+/gimu,
			"",
		);
	const characterCount = Array.from(sanitizedHtmlForCharacterCount).length;
	let htmlContent: string;
	if (classValue) {
		console.log(classValue);
		htmlContent = `<div class="${classValue}">${finalResult}</div>`;
	} else {
		htmlContent = `<div>${finalResult}</div>`;
	}
	console.log(htmlContent);
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

	const sectionsOrder = (() => {
		const sectionsOrderItems: string[] = [];
		const manifestItems = jobj.package.manifest.item;
		for (const element of manifestItems) {
			if (element["@_media-type"].includes("html")) {
				if (element["@_href"].includes("nav") || element["@_id"] === "toc") {
					console.log(element["@_id"]);
					continue;
				}
				const href = element["@_href"].split("/");
				sectionsOrderItems.push(href[href.length - 1].replace(/\..*/, ""));
			}
		}
		return sectionsOrderItems;
	})();
	return { bookTitle, alternativeTitle, sectionsOrder };
}
async function parseNavHtml(navHtml: string) {
	const tableOfContentsItems: TableOfContentsItem[] = [];
	const result = balanced("<ol>", "</ol>", navHtml) ?? {
		body: "",
	};
	const matchs = result.body.matchAll(/href="(.*?)".*?>(.*?)</g);
	for (const match of matchs) {
		if (match[1] && match[2]) {
			const match1Splitted = match[1].replace(/#.*/, "").split("/");
			tableOfContentsItems.push({
				id: match1Splitted[match1Splitted.length - 1].replace(/\..*/, ""),
				displayText: match[2],
				cumulativeCharacterCount: 0,
			});
		}
	}
	return tableOfContentsItems;
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
		sectionsOrder: [],
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
			bookData.sectionsOrder = opfData.sectionsOrder ?? [];
			continue;
		}
		if (key.includes("nav") && key.includes("html")) {
			const data = await values.async("string");
			const navHtmlData = await parseNavHtml(data);
			bookData.tableOfContents = navHtmlData;
			continue;
		}

		if (key.includes("html") && key.includes(".")) {
			console.log(key);
			const data = await values.async("string");
			const htmlData = await parseHtmlFile(data);
			const keySplitted = key.split("/");
			console.log(keySplitted);
			bookData.sections.push({
				id: keySplitted[keySplitted.length - 1].replace(/\..*/, ""),
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
			globalStyles += data.replace(/body/, "div");
			globalStyles += "\n";
		}
	}
	bookData.globalStyles = globalStyles;
	bookData.embeddedImages = embeddedImages;
	bookData.sections.sort(
		(a, b) =>
			bookData.sectionsOrder.indexOf(a.id) -
			bookData.sectionsOrder.indexOf(b.id),
	);
	let cumulativeCharacterCount = 0;
	let i = 0;
	for (const item of bookData.tableOfContents) {
		while (i < bookData.sections.length) {
			const sectionCharacterCount = bookData.sections[i].characterCount;
			cumulativeCharacterCount += sectionCharacterCount;
			i++;
			if (item.id === bookData.sections[i]?.id) {
				item.cumulativeCharacterCount = cumulativeCharacterCount;
				console.log({
					characterCount: bookData.sections[i].characterCount,
					cumulativeCharacterCount,
					itemCharOffset: item.cumulativeCharacterCount,
					id: item.id,
				});
				break;
			}
		}
	}
	for (const sectionParent of bookData.sections) {
		for (const section of bookData.sections) {
			const RegExpression = new RegExp(
				`(?<!xlink:.*?)(?<=href=")(.*?${section.id}.*?)(?=")`,
			);
			const indexNumber = bookData.sectionsOrder.indexOf(section.id);
			sectionParent.htmlContent = sectionParent.htmlContent.replace(
				RegExpression,
				indexNumber.toString(),
			);
		}
	}
	return bookData;
}

import fs from "node:fs";
const epubFile = fs.readFileSync("/home/pedro/Downloads/suzumiya v13.epub");
const book1 = await getBookData(epubFile);
console.log({
	title: book1.bookTitle,
	altTitle: book1.alternativeTitle,
	embeddedImages: book1.embeddedImages,
	sectionsOrder: book1.sectionsOrder,
	sections: book1.sections.map((section) => {
		return {
			id: section.id,
			characterCount: section.characterCount,
			htmlContent: "rawhtml",
		};
	}),
	tableOfContents: book1.tableOfContents,
});
