import { useState } from "react";
import { useMiddlewareStore } from "../store/use-middleware-store";

export function MiddlewareSimulator() {
	const { data, attempts, locked, $data, $locked } = useMiddlewareStore();
	const [inputValue, setInputValue] = useState("");

	return (
		<div className="p-6 bg-yellow-50 shadow-xl rounded-lg max-w-lg mx-auto space-y-4 ring-2 ring-yellow-500/50">
			<h2 className="text-2xl font-bold text-yellow-700">
				2. Middleware Simulator
			</h2>

			<div
				className={`p-3 rounded-md ${
					locked ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
				} flex justify-between items-center font-medium`}
			>
				<span className="font-semibold">
					{locked ? "STORE IS LOCKED (Updates Blocked)" : "Store is UNLOCKED"}
				</span>
				<button
					onClick={() => $locked((l: boolean) => !l)}
					className={`px-3 py-1 text-sm font-bold rounded-full text-white ${
						locked
							? "bg-red-500 hover:bg-red-600"
							: "bg-green-500 hover:bg-green-600"
					} transition`}
				>
					{locked ? "Unlock" : "Lock"}
				</button>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700">
					Input Data (MW transforms to CAPS)
				</label>
				<input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
					placeholder="Type in lowercase to test transformation"
				/>
			</div>

			<div className="flex space-x-4 pt-2">
				<button
					onClick={() => $data(inputValue)} // Magic setter for 'data'
					className="flex-grow px-4 py-2 bg-yellow-600 text-white font-semibold rounded-md shadow-md hover:bg-yellow-700 transition disabled:opacity-50"
				>
					Attempt to Set Data ($data)
				</button>
			</div>

			<div className="mt-4 border-t border-yellow-200 pt-4">
				<p className="font-medium text-gray-800">Current Store State:</p>
				<p>
					Data:{" "}
					<span className="font-bold text-lg text-yellow-700">{data}</span>
				</p>
				<p>
					Total Attempts (Audit via Middleware):{" "}
					<span className="font-bold">{attempts}</span>
				</p>
				<p className="text-sm text-gray-500 mt-2">
					*Updates are processed as path maps: &lbrace;'key': value&rbrace;.
				</p>
			</div>
		</div>
	);
}
