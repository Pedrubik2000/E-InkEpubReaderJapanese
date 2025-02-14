import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { App } from "./App";
import "./index.css";
import { FoldersContainer } from "./components/FoldersContainer";
import { BooksContainer } from "./components/BooksContainer.tsx";
import { BookSection } from "./components/BookSection.tsx";

const domNode = document.getElementById("root");
const root = createRoot(domNode!);

root.render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<App />}>
				<Route index element={<FoldersContainer />} />
				<Route path="folder/:folder" element={<BooksContainer />} />
				<Route path="folder/:folder/book/:book" element={<BooksContainer />} />
				<Route
					path="folder/:folder/book/:book/section/:section"
					element={<BookSection />}
				/>
			</Route>
		</Routes>
	</BrowserRouter>,
);
