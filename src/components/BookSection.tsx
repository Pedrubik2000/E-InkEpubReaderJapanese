import { useEffect, useRef, useState } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { startIDB } from "../utils/epubIDB";
import parse, { domToReact } from "html-react-parser";
import { data, useParams } from "react-router";
import type { BookData } from "../utils/epub";
import { Link, useNavigate } from "react-router";
// Custom Image component to handle dynamic sizing
const CustomImage = ({ src, alt }) => {
	const [style, setStyle] = useState({
		maxWidth: "calc(100vw - 60px)",
		maxHeight: "100%",
	});

	const handleLoad = (event) => {
		const img = event.target;
		if (img.naturalWidth > 400 && img.naturalHeight > 400) {
			// Apply cover styles for large images
			setStyle({
				maxHeight: "100%",
				height: "auto",
				maxWidth: "calc(100vw - 60px)",
			});
		} else {
			// Apply gaiji styles for small images
			setStyle({ width: "16px", height: "auto" });
		}
	};

	return <img src={src} alt={alt} style={style} onLoad={handleLoad} />;
};

function countCharsJapanese(string) {
	//Thanks ttusama
	const sanitizedHtmlForCharacterCount = string
		.replace(/<rt>.*?<\/rt>|<.*?>|\s/gm, "")
		.replace(
			/[^0-9A-Z○◯々-〇〻ぁ-ゖゝ-ゞァ-ヺー０-９Ａ-Ｚｦ-ﾝ\p{Radical}\p{Unified_Ideograph}]+/gimu,
			"",
		);
	const characterCount = Array.from(sanitizedHtmlForCharacterCount).length;
	if (characterCount) {
		return characterCount;
	}
	return 0;
}
function sumCharactersJSX(node) {
	if (!node) return 0;

	// If the node is a string, count the characters
	if (typeof node === "string") {
		return countCharsJapanese(node);
	}

	// If the node is an array, recursively count characters in each element
	if (Array.isArray(node)) {
		return node.reduce((sum, child) => sum + sumCharactersJSX(child), 0);
	}

	// If the node is an object (JSX element), count characters in its children
	if (typeof node === "object" && node.props && node.props.children) {
		return sumCharactersJSX(node.props.children);
	}

	// If the node is an object but doesn't have children, return 0
	return 0;
}
function flattenJSX(node, counter = { index: 0 }) {
	if (!node) return [];

	// If the node is a string, return it as an array element
	if (typeof node === "string") {
		return [node];
	}

	// If the node is an array, recursively flatten each element
	if (Array.isArray(node)) {
		return node.flatMap((child) => flattenJSX(child, counter));
	}

	// If the node is an object (JSX element)
	if (typeof node === "object" && node.props) {
		// Check if the node is a <p> or <img> element
		if (node.type === "p" || node.type === "img") {
			// Generate a new unique key using the counter
			const newKey = `auto-key-${counter.index++}`;
			// Preserve the element with the new key
			return [{ ...node, key: newKey }];
		}
		if (node.type === "image") {
			const newKey = `auto-key-${counter.index++}`;
			return [
				<CustomImage
					key={newKey}
					src={node.props.xlinkHref}
					alt={`image-${newKey}`}
				/>,
			];
		}

		// If the node has children, recursively flatten them
		if (node.props.children) {
			return flattenJSX(node.props.children, counter);
		}
	}

	// If the node is an object but doesn't have children, return it as is
	return [node];
}
interface BookIndexTracker {
	current: number;
	start: number;
	end: number;
}
interface TouchTracker {
	start: number;
	end: number;
}
export function BookSection() {
	const [bookData, setBookData] = useState<BookData>();
	const [contentArray, setContentArray] = useState<JSX.Element[]>([]);
	const [content, setContent] = useState<JSX.Element[]>([]);
	const { folder, book, section } = useParams();
	const sectionRef = useRef(parseInt(section));
	const bookSectionRef = useRef<HTMLDivElement>(null);
	const isOverflowedRef = useRef(false);
	const isDirectionLeftRef = useRef(true);
	const isStartOfSectionRef = useRef(true);
	const bookIndexTrackerRef = useRef<BookIndexTracker>({
		current: 0,
		start: 0,
		end: 0,
	});
	const touchTrackerRef = useRef<TouchTracker>({ start: 0, end: 0 });
	const isFinished = useRef(false);
	const subPageCountRef = useRef(0);
	const [databaseUpdater, setDatabaseUpdater] = useState(0);
	const navigate = useNavigate();
	const [progress, setProgress] = useState("");

	// Fetch book data
	// Reset state when section changes
	useEffect(() => {
		setContentArray([]);
		setContent([]);
		sectionRef.current = parseInt(section);
		isOverflowedRef.current = false;
		bookIndexTrackerRef.current.current = 0;
		bookIndexTrackerRef.current.start = 0;
		bookIndexTrackerRef.current.end = 0;
		subPageCountRef.current = 0;
		isDirectionLeftRef.current = true;
		subPageCountRef.current = 0;
		isFinished.current = false;
	}, [section]);
	useEffect(() => {
		(async () => {
			const db = await startIDB();
			const bookDataRaw: BookData = await db.getFromIndex(
				"books",
				"title",
				book,
			);
			setBookData(bookDataRaw);
			const startValue = Math.max(bookDataRaw.currentIndex.start - 1, 0);
			bookIndexTrackerRef.current = {
				current: startValue,
				start: startValue,
				end: startValue,
			};
		})();
	}, [book]);
	useEffect(() => {
		if (bookData && section && bookSectionRef.current) {
			const sectionContent = bookData.sections[section].htmlContent;

			const unwrapDivs = (domNode, index) => {
				if (domNode.type === "tag") {
					console.log({ domNode });
					const numChildren = domNode.children ? domNode.children.length : 0;
					const key = `${domNode.name}-${section}-${index}-${numChildren}-${domNode.attribs.id || domNode.attribs.class || domNode.attribs.src || domNode.attribs.href || ""}`;

					if (domNode.name === "div") {
						// Unwrap divs by returning their children
						return <>{domToReact(domNode.children, { replace: unwrapDivs })}</>;
					}
					if (domNode.name === "img") {
						// Replace img tags with CustomImage component
						const { src, alt } = domNode.attribs;
						return <CustomImage src={src} alt={alt || book || ""} key={key} />;
					}
					if (domNode.name === "image") {
						console.log({ image: domNode });
						const attribs = domNode.attribs;
						return (
							<CustomImage
								key={key}
								src={attribs["xlink:href"]}
								alt={attribs.alt || book || ""}
							/>
						);
					}
					if (domNode.name === "svg") {
						return <>{domToReact(domNode.children, { replace: unwrapDivs })}</>;
					}
					if (domNode.name === "a") {
						console.log({ A: domNode });
						const href = domNode.attribs.href;
						return (
							<Link
								to={`/folder/${folder}/book/${book}/section/${href || section}`}
								key={key}
							>
								{domToReact(domNode.children)}
							</Link>
						);
					}
					if (domNode.name === "p") {
						domNode.attribs.key = key;
						return domNode;
					}
				}
				return domNode;
			};

			// Parse the HTML content and apply transformations
			const domNodes = parse(sectionContent, { replace: unwrapDivs });

			// Flatten the domNodes into an array of elements
			const flattenedNodes = flattenJSX(domNodes);

			console.log({
				flattenedNodes: flattenedNodes.filter(
					(flattenedNode) => flattenedNode !== "\n",
				),
			});
			setContentArray(
				flattenedNodes.filter((flattenedNode) => flattenedNode !== "\n"),
			);
		}
	}, [bookData, section, book, folder]);
	useEffect(() => {
		if (contentArray.length > 0 && bookSectionRef.current) {
			const scrollWidth = bookSectionRef.current.scrollWidth;
			const clientWidth = bookSectionRef.current.clientWidth;

			console.log({ scrollWidth, clientWidth });
			console.log({
				currentIndex: bookIndexTrackerRef.current.current,
				contentArrayLength: contentArray.length,
				start: bookIndexTrackerRef.current.start,
				end: bookIndexTrackerRef.current.end,
			});

			if (
				isDirectionLeftRef.current &&
				!isFinished.current &&
				!isOverflowedRef.current
			) {
				if (isStartOfSectionRef.current) {
					isStartOfSectionRef.current = false;
					bookIndexTrackerRef.current.start =
						bookIndexTrackerRef.current.current;
				}
				if (
					scrollWidth === clientWidth &&
					bookIndexTrackerRef.current.current === contentArray.length - 1
				) {
					updateDatabaseIndex();
					setContent((prevContent) => {
						const newContent = contentArray.slice(
							bookIndexTrackerRef.current.end,
							bookIndexTrackerRef.current.current + 1,
						);
						bookIndexTrackerRef.current.end =
							bookIndexTrackerRef.current.current;
						isFinished.current = true;
						console.log("Finished");
						return newContent;
					});
				}
				if (
					scrollWidth === clientWidth &&
					bookIndexTrackerRef.current.current < contentArray.length - 1
				) {
					setContent((prevContent) => {
						bookIndexTrackerRef.current.current += 1;
						const newContent = contentArray.slice(
							bookIndexTrackerRef.current.end,
							bookIndexTrackerRef.current.current,
						);

						console.log("Added", {
							currentIndex: bookIndexTrackerRef.current.current,
						});
						return newContent;
					});
				} else if (scrollWidth > clientWidth) {
					console.log("overflowed");

					updateDatabaseIndex();
					if (isDirectionLeftRef.current) {
						setContent((prevContent) => {
							const newContent = contentArray.slice(
								bookIndexTrackerRef.current.end,
								bookIndexTrackerRef.current.current - 1,
							);
							bookIndexTrackerRef.current.end =
								bookIndexTrackerRef.current.current - 1;
							bookIndexTrackerRef.current.current -= 1;
							isOverflowedRef.current = true;
							return newContent;
						});
					}
				}
			}
			if (
				!isDirectionLeftRef.current &&
				!isFinished.current &&
				!isOverflowedRef.current
			) {
				if (isStartOfSectionRef.current) {
					isStartOfSectionRef.current = false;
					bookIndexTrackerRef.current.end =
						bookIndexTrackerRef.current.current + 1;
				}
				if (
					scrollWidth === clientWidth &&
					bookIndexTrackerRef.current.current === 0
				) {
					updateDatabaseIndex();
					setContent((prevContent) => {
						const newContent = contentArray.slice(
							bookIndexTrackerRef.current.current,
							bookIndexTrackerRef.current.start,
						);
						bookIndexTrackerRef.current.start =
							bookIndexTrackerRef.current.current;
						isFinished.current = true;
						console.log("Finished");
						return newContent;
					});
				}
				if (
					scrollWidth === clientWidth &&
					bookIndexTrackerRef.current.current > 0
				) {
					setContent((prevContent) => {
						bookIndexTrackerRef.current.current -= 1;
						const newContent = contentArray.slice(
							bookIndexTrackerRef.current.current,
							bookIndexTrackerRef.current.start,
						);

						console.log("Added", {
							currentIndex: bookIndexTrackerRef.current.current,
						});
						return newContent;
					});
				} else if (scrollWidth > clientWidth) {
					console.log("overflowed");

					updateDatabaseIndex();
					if (!isDirectionLeftRef.current) {
						setContent((prevContent) => {
							const newContent = contentArray.slice(
								bookIndexTrackerRef.current.current + 1,
								bookIndexTrackerRef.current.start,
							);

							bookIndexTrackerRef.current.current += 1;
							bookIndexTrackerRef.current.start =
								bookIndexTrackerRef.current.current + 1;
							console.log({
								index: bookIndexTrackerRef.current.current,
								start: bookIndexTrackerRef.current.start,
								end: bookIndexTrackerRef.current.end,
							});
							isOverflowedRef.current = true;
							return newContent;
						});
					}
				}
			}
		}
	}, [contentArray, bookSectionRef.current, content]);
	const updateDatabaseIndex = () => {
		setDatabaseUpdater((prev) => {
			return prev + 1;
		});
	};
	const handleKeyDown = (event) => {
		console.log(event.key);
		//Going Up
		if (event.key === "ArrowLeft") {
			// Use a functional update to ensure we're working with the latest state
			goingNext();
		}
		//Going back
		if (event.key === "ArrowRight") {
			// Use a functional update to ensure we're working with the latest state
			goingBack();
		}
	};
	const resetDatabaseIndex = () => {
		(async () => {
			const database = await startIDB();
			console.log({
				...bookData,
				currentSection: sectionRef.current,
				currentIndex: { current: 0, start: 0, end: 0 },
			});
			await database.put("books", {
				...bookData,
				currentSection: sectionRef.current,
				currentIndex: { current: 0, start: 0, end: 0 },
			});
		})();
	};
	useEffect(() => {
		(async () => {
			const database = await startIDB();
			console.log({
				...bookData,
				currentSection: sectionRef.current,
				currentIndex: bookIndexTrackerRef.current,
			});
			await database.put("books", {
				...bookData,
				currentSection: sectionRef.current,
				currentIndex: bookIndexTrackerRef.current,
			});
			setProgress(
				`${
					bookData?.sections
						.slice(0, sectionRef.current)
						.reduce(
							(partialSum, section) => partialSum + section.characterCount,
							0,
						) +
					contentArray
						.slice(0, bookIndexTrackerRef.current.start)
						.reduce((partialSum, element) => {
							console.log(element);
							return partialSum + sumCharactersJSX(element);
						}, 0)
				}/${bookData.totalCharacterCount}`,
			);
		})();
	}, [bookData, databaseUpdater]);
	const goingNext = () => {
		console.log("Going left (advancing)");
		console.log({
			indexCount: bookIndexTrackerRef.current.current,
			contentArrayLength: contentArray.length,
		});
		if (bookIndexTrackerRef.current.current === contentArray.length - 1) {
			console.log("Damm moron");
			if (sectionRef.current === bookData.sections.length - 1) {
				resetDatabaseIndex();
				navigate(`/folder/${folder}`);
			} else {
				navigate(
					`/folder/${folder}/book/${book}/section/${sectionRef.current + 1}`,
				);
			}
		}
		setContent((prevContent) => {
			// Create a new array with the additional elements
			console.log(bookIndexTrackerRef.current.end);
			const newContent = contentArray.slice(
				bookIndexTrackerRef.current.end,
				bookIndexTrackerRef.current.end + 1,
			);
			bookIndexTrackerRef.current.current = bookIndexTrackerRef.current.end + 1; // Increment the counter
			isOverflowedRef.current = false;
			isStartOfSectionRef.current = true;
			isDirectionLeftRef.current = true;
			isFinished.current = false;
			return newContent;
		});
	};
	const goingBack = () => {
		console.log("Going right (advancing)");
		console.log({
			indexCount: bookIndexTrackerRef.current.current,
			contentArrayLength: contentArray.length,
		});
		console.log({ lastStartSectionRef: bookIndexTrackerRef.current.start });
		bookIndexTrackerRef.current.start = Math.max(
			bookIndexTrackerRef.current.start - 1,
			0,
		);
		bookIndexTrackerRef.current.current = Math.max(
			bookIndexTrackerRef.current.start - 1,
			0,
		);
		if (bookIndexTrackerRef.current.start === 0) {
			console.log("Damm moron");
			if (sectionRef.current === 0) {
				resetDatabaseIndex();
				navigate(`/folder/${folder}`);
			} else {
				navigate(
					`/folder/${folder}/book/${book}/section/${sectionRef.current - 1}`,
				);
			}
		}
		setContent((prevContent) => {
			const newContent = contentArray.slice(
				bookIndexTrackerRef.current.current,
				bookIndexTrackerRef.current.start,
			);
			isDirectionLeftRef.current = false;
			isStartOfSectionRef.current = true;
			isOverflowedRef.current = false;
			isFinished.current = false;
			return newContent;
		});
	};
	const changeDirection = () => {
		const diff = touchTrackerRef.current.start - touchTrackerRef.current.end;
		if (diff < -100) {
			goingNext();
		} else if (diff > 100) {
			goingBack();
		} else {
		}
	};

	const handleTouchStart = (event: React.TouchEvent) => {
		touchTrackerRef.current.start = event.changedTouches[0].screenX;
	};
	const handleTouchEnd = (event: React.TouchEvent) => {
		touchTrackerRef.current.end = event.changedTouches[0].screenX;
		changeDirection();
	};
	return (
		<div
			ref={bookSectionRef}
			className="bookSection"
			style={{ overflowX: "auto", whiteSpace: "wrap" }}
			onKeyDown={handleKeyDown}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			tabIndex={-1}
		>
			{content}
			{bookData &&
				createPortal(
					<p>{progress}</p>,
					document.body.querySelector(".Toolbar"),
				)}
		</div>
	);
}
