import { store } from "storeflow";

export const useMiddlewareStore = store({
	data: "Original Value",
	attempts: 0,
	locked: false,
}).middleware([
	// Middleware 1: Validation and Audit
	(currentState, incomingUpdate, next) => {
		const incomingPaths = Object.keys(incomingUpdate);
		// Block data updates if the store is locked
		const hasDataUpdate = incomingPaths.some((path) => path !== "locked");

		if (currentState.locked && hasDataUpdate) {
			console.log(
				"%c[MW 1: Lock Check] Update CANCELLED (Store is locked).",
				"color: red;"
			);
			return next(false); // CANCEL the update chain
		}

		// Audit: Create a new update to increment attempts
		const nextUpdate = {
			...incomingUpdate,
			attempts: currentState.attempts + 1,
		};
		next(nextUpdate); // Pass the audited update to the next middleware
	},

	// Middleware 2: Transformation
	(currentState, incomingUpdate, next) => {
		if ("data" in incomingUpdate && typeof incomingUpdate.data === "string") {
			const modifiedData = incomingUpdate.data.toUpperCase();
			console.log(`[MW 2: Transform] Data capitalized to "${modifiedData}"`);
			next({ data: modifiedData }); // Pass only the transformed update
		} else {
			next(); // Continue without changes
		}
	},
]);
