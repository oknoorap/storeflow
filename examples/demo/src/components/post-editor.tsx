import { useAnotherOneStore } from "../store/use-another-store";
import { usePostStore } from "../store/use-post-store";

export function PostEditor() {
	const { title, content, meta, $title, $content, $meta_updatedAt } =
		usePostStore();
	const { count, $count } = useAnotherOneStore();

	return (
		<div className="p-6 bg-white shadow-xl rounded-lg max-w-lg mx-auto space-y-4 ring-2 ring-indigo-500/50">
			<h2 className="text-2xl font-bold text-indigo-700">
				1. Post Store (Basic & Nested)
			</h2>

			{/* Title Input: Triggers .effect() */}
			<div>
				<label className="block text-sm font-medium text-gray-700">
					Title ($title)
				</label>
				<input
					type="text"
					value={title}
					onChange={(e) => $title(e.target.value)}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
					placeholder="Type here to see the effect fire"
				/>
			</div>

			{/* Content Display (Updated by dependency) */}
			<div>
				<label className="block text-sm font-medium text-gray-700">
					Content (Updates at Count=5)
				</label>
				<p className="mt-1 block w-full rounded-md bg-gray-100 p-2 text-sm text-gray-600 border border-gray-300 min-h-[40px] whitespace-pre-wrap">
					{content}
				</p>
			</div>

			{/* Nested Setter Demo */}
			<div className="pt-4 border-t border-indigo-200">
				<label className="block text-sm font-medium text-gray-700">
					Meta Information (Nested Access)
				</label>
				<p className="text-sm text-gray-600">
					Updated At:{" "}
					<span className="font-semibold">
						{meta.updatedAt.toLocaleTimeString()}
					</span>
				</p>
				<button
					// Magic setter for 'meta.updatedAt'
					onClick={() => $meta_updatedAt(new Date())}
					className="mt-2 px-4 py-2 bg-indigo-500 text-white font-semibold rounded-md shadow-md hover:bg-indigo-600 transition text-sm"
				>
					Update Nested Time ($meta_updatedAt)
				</button>
				<p className="text-xs text-gray-500 mt-1">
					*Check console for prev('meta.updatedAt') log.
				</p>
			</div>

			{/* Dependency Trigger */}
			<div className="pt-4 border-t border-indigo-200">
				<h3 className="text-lg font-semibold text-purple-700">
					3. Dependency Store Trigger
				</h3>
				<button
					onClick={() => $count((c: number) => c + 1)}
					className="mt-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 transition"
				>
					Increment Count ({count})
				</button>
				<p className="text-sm self-center text-gray-600 mt-1">
					*If count reaches 5, the dependency effect will update the Post
					Content above!
				</p>
			</div>
		</div>
	);
}
