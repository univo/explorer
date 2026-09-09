import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { AddressSchema, FilterSchema } from "@/schema";
import { AddressEventsRsc } from "@/frames/address/address-events-rsc";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(
		v.object({
			cursor: v.string(),
			filter: FilterSchema,
			address: AddressSchema,
		}),
	)
	.handler((context) => {
		return renderToReadableStream(
			<AddressEventsRsc
				filter={context.data.filter}
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

				const filter = search.get("filter");
				if (filter === null) throw new Error("Expected request filter");

				const cursor = search.get("cursor");
				if (cursor === null) throw new Error("Expected request cursor");

				const stream = await getFlightStream({ data: { address, filter, cursor } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
