import { store } from "storeflow";
import { usePostStore } from "./use-post-store";

export const useAnotherOneStore = store({
	hello: "world",
	count: 0,
})
	.depends([usePostStore]) // Depends on usePostStore
	.effect(async ([ownState, postStoreResult], prev) => {
		// Destructure own state
		const { count } = ownState;
		// Destructure dependent state and setters
		const { title, $content } = postStoreResult;

		console.log(
			"%c--- [3] Dependency Effect Triggered ---",
			"color: green; font-weight: bold;"
		);
		console.log(`[3] Dependency Title: "${title}"`);

		// Example: If count reaches 5, use the dependent store's setter to update it.
		if (count === 5 && prev("count") !== 5) {
			console.warn(
				`[3] Count reached 5! Updating Post Content via dependency setter: $content().`
			);
			// We can directly call the Magic Setter of the dependent store!
			$content(
				`Storeflow is awesome! Content update triggered by dependency store, count is ${count}.`
			);
		}
	});
