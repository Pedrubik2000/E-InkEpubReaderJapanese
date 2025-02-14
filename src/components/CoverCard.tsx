import { Link } from "react-router";

export function CoverCard({ text, blob, linkTo }) {
	return (
		<div className="coverCard">
			<Link to={linkTo}>
				<img src={URL.createObjectURL(blob)} alt={text} />
			</Link>
		</div>
	);
}
