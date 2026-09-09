import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { AddressSchema } from "@/schema";
import { AddressEventsRsc } from "@/frames/address/address-events-rsc";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: AddressSchema, filter: v.picklist(["all", "payments", "trades", "lending"]), cursor: v.string() }))
	.handler(({ data }) =>
		renderToReadableStream(<AddressEventsRsc address={data.address} filter={data.filter} startCursor={data.cursor} />),
	);

export const Route = createFileRoute("/rsc/address-events")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const address = search.get("address");
				if (address === null) throw new Error("Expected request address");

				const filter = search.get("filter") as any;
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
