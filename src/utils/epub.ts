import JSZip from "jszip";
import fs from "node:fs";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import balanced from "balanced-match";

interface Book {
	title: string;
	altTitle: string;
	creator: string[] | string;
	identifier: string;
	language: string;
	date: string;
	publisher: string;
	readingDirection: string;
	pageDirection: string;
	html: string;
	blobs: imageBlobObject[];
}
interface imageBlobObject {
	name: string;
	blob: Blob;
}

const epubFile = fs.readFileSync(
	"/home/pedro/Downloads/kumakumakuma v001.epub",
);

async function getBookObject(epubBuffer: Buffer) {
	const epub = new JSZip();
	const blobs: imageBlobObject[] = [];

	const book: Book = {
		title: "",
		altTitle: "",
		creator: "",
		identifier: "",
		language: "",
		date: "",
		publisher: "",
		readingDirection: "",
		pageDirection: "",
		html: "",
		blobs: [],
	};

	epub.loadAsync(epubBuffer).then(async (epubContent) => {
		const epubObject = epubContent.files;
		let htmlCombined = "";
		for (const [key, values] of Object.entries(epubObject)) {
			// console.log({ key, values });
			// if (key.includes(".xml")) {
			// 	console.log({ key, values });
			// 	const data = await values.async("string");
			// 	console.log(data);
			// }
			// if (key.includes("mimetype")) {
			// 	console.log({ key, values });
			// 	const data = await values.async("string");
			// 	console.log(data);
			// }
			if (key.includes(".opf")) {
				console.log({ key, values });
				const data = await values.async("string");
				console.log(data);
				const options = {
					ignoreAttributes: false,
					attributeNamePrefix: "@_",
					allowBooleanAttributes: true,
					parseAttributeValue: true,
					processEntities: true, // To process special characters like &amp;, &lt; etc.
					removeNSPrefix: true, // Removes namespace prefixes (like dc:, opf:)
				};
				const parser = new XMLParser(options);

				const jobj = parser.parse(data);
				console.log(jobj.package);

				book.title =
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
				book.creator =
					(() => {
						const creator = jobj.package.metadata.creator;
						if (Object.prototype.toString.call(creator) === "[object Array]") {
							const creators: string[] = [];
							for (const element of creator) {
								creators.push(element["#text"]);
							}
							return creators;
						}
						return jobj.package.metadata.creator["#text"];
					})() ?? "";
				book.identifier =
					(() => {
						const identifier = jobj.package.metadata.identifier;
						if (
							Object.prototype.toString.call(identifier) === "[object Array]"
						) {
							for (const element of identifier) {
								console.log(element);
								if (element.includes("mobi")) {
									const elementSplitted: Array<string> = element.split(":");
									return elementSplitted[elementSplitted.length - 1];
								}
							}
							return "";
						}
						const identifierSplitted = identifier["#text"].split(":");
						if (identifierSplitted.length > 1) {
							return identifierSplitted[identifierSplitted.length - 1];
						}
						return identifier["#text"];
					})() ?? "";
				book.language =
					(() => {
						const language = jobj.package.metadata.language;
						if (
							Object.prototype.toString.call(language) === "[object Object]"
						) {
							return language["#text"];
						}
						return language;
					})() ?? "";
				book.date = jobj.package.metadata.date ?? "";
				book.publisher =
					(() => {
						const publisher = jobj.package.metadata.publisher;
						if (
							Object.prototype.toString.call(publisher) === "[object Object]"
						) {
							return publisher["#text"];
						}
						return publisher;
					})() ?? "";
				book.readingDirection =
					(() => {
						const meta = jobj.package.metadata.meta;
						for (const element of meta) {
							if (element["@_name"] === "primary-writing-mode") {
								return element["@_content"];
							}
						}
						return "";
					})() ?? "";
				book.pageDirection =
					jobj.package.spine["@_page-progression-direction"] ?? "";
				book.altTitle =
					(() => {
						const meta = jobj.package.metadata.meta;
						for (const element of meta) {
							if (element["@_property"] === "belongs-to-collection") {
								return element["#text"];
							}
						}
						return jobj.package.metadata.title["#text"];
					})() ?? "";
				console.log(jobj.package.metadata);
				// console.log(jobj.package.manifest);
				// console.log(jobj.package.spine);
				console.log(book);
			}
			// if (key.includes(".xhtml")) {
			// 	console.log({ key, values });
			// 	const data = await values.async("string");
			// 	console.log(data);
			// }
			if (key.includes(".html")) {
				console.log({ key, values });
				const data = await values.async("string");
				const result = balanced('<div class="main">', "</div>", data) ?? {
					body: "",
				};
				const regexHref = /(?<=href=")(.+?)(?=#.*?")/gm;
				const finalResult = result.body.replace(regexHref, "");
				htmlCombined += finalResult;
			}
			if (key.includes(".jpeg")) {
				const data = await values.async("blob");
				const blobWithType = new Blob([data], { type: "image/jpeg" });
				blobs.push({
					name: key,
					blob: blobWithType,
				});
			}
			// if (key.includes(".css")) {
			// 	console.log({ key, values });
			// 	const data = await values.async("string");
			// 	console.log(data);
			// }
		}
		const multilineString = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>HTML 5 Boilerplate</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
      <div class="main">
      ${htmlCombined}
      <div>
      </body>
    </html>
    `;
		book.html = multilineString;
		console.log({ multilineString });
		console.log({ blobs });
		book.blobs = blobs;
		return book;
		// fs.writeFileSync("/home/pedro/index.html", multilineString);
	});
}

const book1 = await getBookObject(epubFile);
console.log(book1);
