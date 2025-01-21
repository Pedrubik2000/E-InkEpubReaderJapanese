// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import { BookVols } from "./BookVols.tsx";
import { BooksFolders } from "./BooksFolders.tsx";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<App />}>
				<Route index element={<BooksFolders />} />
				<Route path="book/:book" element={<BookVols />} />
				<Route path="book/:book/vol/:volTitle" element={<p>a</p>} />
				<Route path="book/:book/vol/:volTitle/:part" element={<p>a</p>} />
			</Route>
		</Routes>
	</BrowserRouter>,
);
