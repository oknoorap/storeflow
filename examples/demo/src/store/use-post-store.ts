import { store } from "storeflow";

export const usePostStore = store({
	title: "Initial Title",
	content: "The initial content.",
	meta: {
		updatedAt: new Date(),
	},
}).effect(async ([{ title }], prev) => {
	const prevTitle = prev("title");
	const prevUpdatedAt = prev("meta.updatedAt");

	console.log("%c--- [1] Post Store Effect Triggered ---", "color: blue;");
	if (prevTitle !== title) {
		console.warn(
			`[1] Title change detected! From "${prevTitle}" to "${title}"`
		);
	}
	console.log(
		`[1] Previous Nested Time: ${
			prevUpdatedAt ? new Date(prevUpdatedAt).toLocaleTimeString() : "N/A"
		}`
	);
});

export type PostStore = ReturnType<typeof usePostStore>;
