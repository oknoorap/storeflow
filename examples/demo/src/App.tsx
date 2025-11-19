import { MiddlewareSimulator } from "./components/middleware-simulator";
import { PostEditor } from "./components/post-editor";

export default function App() {
	return (
		<div className="min-h-screen bg-gray-50 p-8 font-sans">
			<h1 className="text-4xl font-extrabold text-center mb-10 text-gray-900">
				⚛️ Storeflow Demo: Atomic React State
			</h1>
			<p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
				This single file contains the entire Storeflow state implementation and
				three distinct store examples: Basic/Nested, Middleware, and Cross-Store
				Dependencies. The dependency effect for store 3 is now strongly typed!
				<br />
				See source code:{" "}
				<a
					href="https://github.com/oknoorap/storeflow/blob/main/examples/demo/src/App.tsx"
					target="_blank"
					className="text-indigo-500 hover:underline"
				>
					src/App.tsx
				</a>
			</p>
			<div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
				<PostEditor />
				<MiddlewareSimulator />
			</div>
		</div>
	);
}
