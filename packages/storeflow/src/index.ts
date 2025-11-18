import { useCallback, useSyncExternalStore } from "react";

/**
 * Recursively flattens an object, generating dot-separated paths (e.g., 'a.b.c')
 * for all non-object/non-Date/non-Array values. This is crucial for generating
 * the Magic Setters for nested properties and for handling updates.
 */
const flattenObject = (
	obj: any,
	prefix = "",
	result: { [key: string]: any } = {}
): { [key: string]: any } => {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const newKey = prefix ? `${prefix}.${key}` : key;
			const value = obj[key];

			if (
				typeof value === "object" &&
				value !== null &&
				!Array.isArray(value) &&
				!(value instanceof Date)
			) {
				flattenObject(value, newKey, result);
			} else {
				result[newKey] = value;
			}
		}
	}
	return result;
};

/**
 * Retrieves a nested value from an object using a dot-separated path string.
 * Used internally by the 'prev' getter in .effect().
 */
const getNestedValue = (obj: any, path: string): any => {
	return path
		.split(".")
		.reduce(
			(acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
			obj
		);
};

/**
 * Creates a new object by deeply setting a value at the specified path.
 * Ensures immutability by cloning the necessary parts.
 */
const setNestedValue = (obj: any, path: string, value: any): any => {
	const parts = path.split(".");
	const lastKey = parts.pop();
	if (!lastKey) return obj;

	const setDeep = (target: any, index: number): any => {
		const currentKey = parts[index];

		if (index === parts.length) {
			return { ...target, [lastKey]: value };
		}

		return {
			...target,
			[currentKey]: setDeep(target[currentKey] || {}, index + 1),
		};
	};

	return setDeep(obj, 0);
};

// Internal update type (a map of 'dot.path' to new value)
type DeepUpdateMap = { [path: string]: any };

// The state itself
type State<T extends object> = T;

// The dynamically generated setters (Setters are loosely typed as their arguments are complex
// to type strictly due to dynamic path flattening and updater functions.)
type DynamicSetters<T extends object> = {
	[key: string]: (value: any | ((prevState: any) => any)) => void;
};

// The full hook result combines state and dynamic setters
type StoreHookResult<T extends object> = State<T> & DynamicSetters<T>;

// PrevGetter allows checking previous state by path
type PrevGetter<T extends object> = (path: string) => any;
type StoreHook<T extends object> = () => StoreHookResult<T>;
type Next = (modifiedUpdate?: DeepUpdateMap | false) => void;

type MiddlewareFn<T extends object> = (
	currentState: Readonly<T>,
	incomingUpdate: Readonly<DeepUpdateMap>,
	next: Next
) => void;

// NonHookGetter is used internally to get the result outside of a component
type NonHookGetter<T extends object> = () => StoreHookResult<T>;

// Helper to extract the HookResult type from a FinalStore type
type ExtractHookResult<S> = S extends FinalStore<infer T, any>
	? StoreHookResult<T>
	: never;

// Helper to convert a tuple of FinalStores to a tuple of HookResults
type StoreTupleToResultTuple<T extends FinalStore<any, any>[]> = {
	[K in keyof T]: ExtractHookResult<T[K]>;
};

export type FinalStore<
	T extends object,
	D extends FinalStore<any, any>[] = []
> = StoreHook<T> &
	ChainedStore<T, D> & {
		__get_non_hook_result: NonHookGetter<T>;
		__initialState: T;
	};

export interface ChainedStore<
	T extends object,
	D extends FinalStore<any, any>[] = []
> {
	effect: (
		fn: (
			state: [StoreHookResult<T>, ...StoreTupleToResultTuple<D>],
			prev: PrevGetter<T>
		) => Promise<void> | void
	) => FinalStore<T, D>;

	middleware: (fns: MiddlewareFn<T>[]) => FinalStore<T, D>;

	depends: <D_NEW extends FinalStore<any, any>[]>(
		dependencies: D_NEW
	) => FinalStore<T, D_NEW>;
}

export function store<T extends object>(initialState: T): FinalStore<T, []> {
	let state = initialState;
	let previousState = JSON.parse(JSON.stringify(initialState));
	let listeners = new Set<() => void>();

	let effectFn:
		| ((state: any, prev: PrevGetter<T>) => Promise<void> | void)
		| null = null;
	let middlewares: MiddlewareFn<T>[] = [];
	let dependentStores: FinalStore<any, any>[] = [];

	const prev: PrevGetter<T> = (path) => getNestedValue(previousState, path);
	const getState = () => state;

	const subscribe = (onStoreChange: () => void) => {
		listeners.add(onStoreChange);
		return () => listeners.delete(onStoreChange);
	};

	/** Core function to execute the state update (called after middleware chain) */
	const executeUpdate = (updates: DeepUpdateMap) => {
		if (Object.keys(updates).length === 0) return;

		// 1. Capture previous state (deep clone)
		previousState = JSON.parse(JSON.stringify(state));

		// 2. Update current state (deeply immutable update)
		let newState = state;
		for (const path in updates) {
			if (Object.prototype.hasOwnProperty.call(updates, path)) {
				newState = setNestedValue(newState, path, updates[path]);
			}
		}
		state = newState;

		// 3. Notify listeners
		listeners.forEach((listener) => listener());

		// 4. Run effect after state update
		if (effectFn) {
			let effectArgs: any = state;

			if (dependentStores.length > 0) {
				// Get state and setters of dependencies (non-hook access)
				const depStates = dependentStores.map((depStore) =>
					depStore.__get_non_hook_result()
				);
				// Effect arguments are always passed as a tuple [OwnState, ...Dependencies]
				effectArgs = [getState() as StoreHookResult<T>, ...depStates];
			} else {
				// If no dependencies, the effect function expects T (but the typed signature expects a tuple, so we adapt the argument here)
				effectArgs = [getState() as StoreHookResult<T>];
			}

			setTimeout(() => effectFn?.(effectArgs, prev), 0);
		}
	};

	/** Primary function for state change, handles the middleware chain. */
	const _setPathValue = (path: string, value: any) => {
		const update = { [path]: value };

		if (middlewares.length === 0) {
			return executeUpdate(update);
		}

		let currentUpdate = update;
		let shouldProceed = true;
		let index = 0;

		const dispatch = () => {
			if (!shouldProceed || index >= middlewares.length) {
				if (shouldProceed) {
					executeUpdate(currentUpdate);
				}
				return;
			}

			const middleware = middlewares[index];

			const next: Next = (modifiedUpdate) => {
				if (modifiedUpdate === false) {
					shouldProceed = false;
				} else if (modifiedUpdate) {
					// Merge modifications from middleware into the current update map
					currentUpdate = { ...currentUpdate, ...modifiedUpdate };
				}
				index++;
				dispatch(); // Continue the chain
			};

			// Pass current state and the accumulated update map to the middleware
			middleware(state, currentUpdate, next);
		};

		dispatch();
	};

	// 1. Calculate static paths once (outside any function/hook)
	const flattened = flattenObject(initialState);
	const setterPaths = Object.keys(flattened);

	// --- Magic Setter Generation (NON-HOOK only - for dependency access) ---
	const createNonHookSetters = (): DynamicSetters<T> => {
		const setters = {} as DynamicSetters<T>;

		for (const path of setterPaths) {
			// Convert 'a.b.c' path to magic setter '$a_b_c'
			const setterName = `$${path.replace(/\./g, "_")}`;

			const setterFn = (valueOrUpdater: any) => {
				let valueToSet = valueOrUpdater;

				// Handle updater function (e.g. $count(c => c + 1))
				if (typeof valueOrUpdater === "function") {
					const updater = valueOrUpdater as (prevState: any) => any;
					const currentValue = getNestedValue(getState(), path);
					valueToSet = updater(currentValue);
				}

				_setPathValue(path, valueToSet);
			};

			(setters as any)[setterName] = setterFn;
		}

		return setters;
	};

	/** The actual React hook. This is where the fix is applied. */
	const useStore = (): StoreHookResult<T> => {
		// Hook 1: useSyncExternalStore
		const currentState = useSyncExternalStore(subscribe, getState);

		const hookSetters = {} as DynamicSetters<T>;

		// FIX: Inline the loop that calls useCallback directly into the hook body.
		// Since the number of iterations (setterPaths.length) is static based on T,
		// this satisfies the Rules of Hooks.
		for (const path of setterPaths) {
			const setterName = `$${path.replace(/\./g, "_")}`;

			// Define the setter function (which closes over the store's stable utility functions)
			const setterFn = (valueOrUpdater: any) => {
				let valueToSet = valueOrUpdater;

				if (typeof valueOrUpdater === "function") {
					const updater = valueOrUpdater as (prevState: any) => any;
					const currentValue = getNestedValue(getState(), path);
					valueToSet = updater(currentValue);
				}

				_setPathValue(path, valueToSet);
			};

			// Hook 2, Hook 3, etc.: useCallback is now directly in the hook body.
			(hookSetters as any)[setterName] = useCallback(setterFn, [path]);
		}

		return { ...currentState, ...hookSetters } as StoreHookResult<T>;
	};

	// --- CHAINING LOGIC ---
	const finalHook = useStore as FinalStore<T, []>;

	// Expose non-hook access for dependency injection
	finalHook.__get_non_hook_result = () => {
		const currentState = getState();
		// Use the non-hook version of setter creation here
		const setters = createNonHookSetters();
		return { ...currentState, ...setters } as StoreHookResult<T>;
	};

	finalHook.__initialState = initialState;

	// Effect function is now strongly typed by the ChainedStore interface
	finalHook.effect = function (fn) {
		effectFn = fn as any;
		// We must return the finalHook, but TypeScript requires coercion for the generic flow
		return finalHook as any;
	};

	finalHook.middleware = function (fns) {
		middlewares = fns;
		return finalHook as any;
	};

	// Depends function is now strongly typed by the ChainedStore interface
	finalHook.depends = function (dependencies) {
		dependentStores = dependencies as any;
		// Coerce the return type to match the new dependency tuple D_NEW
		return finalHook as any;
	};

	return finalHook;
}
