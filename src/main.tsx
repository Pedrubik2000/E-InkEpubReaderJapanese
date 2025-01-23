// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import { BookVols } from "./BookVols.tsx";
import { BooksFolders } from "./BooksFolders.tsx";
import App from "./App.tsx";
import { BookSection } from "./BookSection.tsx";

createRoot(document.getElementById("root")!).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<App />}>
				<Route index element={<BooksFolders />} />
				<Route path="folder/:folder" element={<BookVols />} />
				<Route
					path="folder/:folder/:volNumber/:sectionIndex"
					element={<BookSection />}
				/>
			</Route>
		</Routes>
	</BrowserRouter>,
);
