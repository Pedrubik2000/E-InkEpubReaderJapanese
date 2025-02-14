import { Link, useLocation } from "react-router";

export function Breadcrumbs() {
	const location = useLocation();
	console.log({ location });
	console.log({ location: location.pathname.split("/") });
	if (location.pathname === "/") {
		return (
			<p>
				<Link to={"/"}>🏠</Link>
				{"/"}
			</p>
		);
	} else {
		const locationSplitted = location.pathname.split("/");
		const breadCrumbsLinks = [];
		for (let index = 2; index <= locationSplitted.length; index++) {
			const currentLocation = locationSplitted[index - 1];
			const lastLocation = locationSplitted[index - 2];
			const locationString = locationSplitted.slice(0, index).join("/");
			console.log(locationString);
			if (currentLocation === "folder") {
				breadCrumbsLinks.push(
					<Link to={"/"} key={"folders"}>
						🏠
					</Link>,
				);
				breadCrumbsLinks.push(<span key={"folders>"}>{"/"}</span>);
			} else if (currentLocation === "book") {
			} else if (lastLocation) {
				if (lastLocation === "folder") {
					breadCrumbsLinks.push(
						<Link to={locationString} key={locationString}>
							📁
						</Link>,
					);
					breadCrumbsLinks.push(<span key={`${locationString}>`}>{"/"}</span>);
				}
			} else {
				breadCrumbsLinks.push(
					<Link to={locationString} key={locationString}>
						{decodeURIComponent(locationSplitted[index - 1])}
					</Link>,
				);
				breadCrumbsLinks.push(<span key={`${locationString}>`}>{"/"}</span>);
			}
		}
		return <p>{breadCrumbsLinks}</p>;
	}
}
