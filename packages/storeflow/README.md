# **⚛️ Storeflow: The Atomic State Engine for React**

Storeflow is a small, zero-boilerplate, and highly reactive state management library built on native React hooks. It removes the friction of manual actions, selectors, and reducers, allowing you to manage complex nested states with unprecedented simplicity and control.

If you’re tired of the boilerplate associated with Redux, or the limitations of plain useState for global/nested state, **Storeflow is your solution.**

## **✨ Why Storeflow Will Be Your Favorite Store**

### **1. Magic Setters (Zero Boilerplate)**

Storeflow automatically generates a setter for every property, **including nested ones**. You never write a reducer or an action type again.

- If your state has user.profile.name, you get a direct setter: $user_profile_name().
- If your state has count, you get: $count().

### **2. Built-in Middleware**

Intercept, transform, validate, or audit **any state change** before it hits the store. Middleware is run sequentially and gives you full control over the update lifecycle.

### **3. Cross-Store Dependencies**

Orchestrate data flow between stores seamlessly. A store's side-effect (.effect) can subscribe to and react to changes in other stores, even updating them directly.

### **4. Fully Reactive & DevTools Ready**

It uses the native useSyncExternalStore hook, ensuring minimal re-renders and optimal performance, making it completely compatible with the React concurrency model.

## **🚀 Getting Started (The Basic Store)**

A Storeflow store is initialized by calling the store() function with an initial state object. This returns a React hook that you can use in any component.

### **Store Definition**

```ts
// store(initialState) -> returns a custom hook
const useCounterStore = store({
	count: 0,
	isEven: true,
	settings: {
		step: 1,
		limit: 10,
	},
});
```

### **Usage in a Component**

```tsx
import { useCounterStore } from "./your-store";

function Counter() {
	// Destructure state properties and the generated Magic Setters
	const {
		count,
		isEven,
		$count,
		$isEven,
		$settings_step, // Nested setter for 'settings.step'
	} = useCounterStore();

	const handleIncrement = () => {
		// 1. Direct value setting
		$count(count + 1);

		// 2. Updater function (recommended for relying on previous state)
		$isEven((prevIsEven) => (count + 1) % 2 === 0);

		// 3. Setting a nested value directly
		if (count === 5) {
			$settings_step(2);
			console.log("Step has been updated via $settings_step setter.");
		}
	};

	return (
		<div className="card">
			<p>
				Count: {count} ({isEven ? "Even" : "Odd"})
			</p>
			<p>Current Step: {step}</p>
			<button onClick={handleIncrement}>Increment</button>
		</div>
	);
}
```

## **⚙️ Advanced Control: Middleware**

Storeflow's middleware lets you intercept the update object **before** the state is committed. This is perfect for logging, validation, authorization, or transformation.

Middleware receives a DeepUpdateMap (a map of path:value pairs) and uses the next() callback to continue or cancel the update.

### **Middleware Implementation**

```tsx
const useAuditStore = store({
	userId: "user-123",
	lastAction: null,
	isFrozen: false,
}).middleware([
	// Middleware 1: Audit and Transformation
	(currentState, incomingUpdate, next) => {
		// Audit: Always update 'lastAction' path
		const auditUpdate = {
			lastAction: new Date().toISOString(),
		};

		// Check if the update contains a change to 'userId' and capitalize it (Transformation)
		if ("userId" in incomingUpdate) {
			auditUpdate.userId = (incomingUpdate.userId as string).toUpperCase();
		}

		// Pass the merged update map to the next middleware
		next({ ...incomingUpdate, ...auditUpdate });
	},

	// Middleware 2: Validation and Cancellation
	(currentState, incomingUpdate, next) => {
		if (currentState.isFrozen) {
			console.error("Store is frozen. Update blocked!");
			// Cancel the update chain completely
			return next(false);
		}
		// Continue the chain
		next();
	},
]);
```

## **🔗 State Orchestration: Effects and Dependencies**

### **1. The .effect() Hook**

The .effect() method registers a function that runs **after** every successful state update. It is non-blocking and ideal for side-effects like asynchronous calls, data saving, or updating related data.

Crucially, the effect callback provides a special prev getter:

```ts
.effect(async ([{ settings }], prev) => {
 // Use dot notation to access previous values, even deeply nested ones
 const prevLimit = prev('settings.limit');
 const currentLimit = settings.limit;

  if (prevLimit !== currentLimit) {
    console.log(`Limit changed from ${prevLimit} to ${currentLimit}. Persisting to DB...`);
    // await saveToDatabase(currentState);
  }
})
```

### **2. Cross-Store Dependencies**

Use .depends() to register other Storeflow stores. When the effect runs, the state and setters of the dependent stores are passed in as extra arguments to your effect function.

```ts
// Assume useThemeStore is another Storeflow store
const useThemeStore = store({ darkMode: false });

const useContentStore = store({
	headline: "Hello World",
	viewCount: 0,
})
	.depends([useThemeStore]) // Register the dependency
	.effect(([contentState, themeStoreResult]) => {
		// themeStoreResult contains the state AND the Magic Setters of useThemeStore

		const { darkMode } = themeStoreResult;

		if (contentState.viewCount > 100 && !darkMode) {
			console.log("High view count detected! Forcing Dark Mode.");
			// Use the dependency's setter to update the other store!
			themeStoreResult.$darkMode(true);
		}
	});
```

**Storeflow makes state orchestration effortless and explicit, preventing messy circular imports and unclear data flow.**

## **🛠️ Developer Tips**

- **Avoid Over-Nested State:** While Storeflow handles deep nesting, keep your state structures relatively flat for maximum readability and performance.
- **Use Updater Functions:** Always use the updater function signature ($count(c => c + 1)) when the new state value depends on the previous state, just like with standard React useState.
- **Middleware vs. Effect:** Use **Middleware** for synchronous tasks like validation and transformation _before_ the state update. Use **Effect** for asynchronous tasks and side-effects _after_ the state update.

**Storeflow is designed to be the final state management solution you’ll need for modern React applications. Give it a try, and watch the boilerplate disappear.**

### License MIT

copyright (c) oknoorap
