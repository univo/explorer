import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { AddressSchema, PresetSchema } from "@/schema";
import { AddressEventsRsc } from "@/frames/address/address-events-rsc";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(
		v.object({
			cursor: v.string(),
			preset: PresetSchema,
			address: AddressSchema,
		}),
	)
	.handler((context) => {
		return renderToReadableStream(
			<AddressEventsRsc
				preset={context.data.preset}
				address={context.data.address} //
				startCursor={context.data.cursor}
			/>,
		);
	});

export const Route = createFileRoute("/rsc/address-events")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const address = search.get("address");
				if (address === null) throw new Error("Expected request address");

				const preset = search.get("preset");
				if (preset === null) throw new Error("Expected request preset");

				const cursor = search.get("cursor");
				if (cursor === null) throw new Error("Expected request cursor");

				const stream = await getFlightStream({ data: { address, preset, cursor } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
