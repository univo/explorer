import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { AddressSchema } from "@/schema";
import { AddressEventsServer } from "@/views/address/address-events-server";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: AddressSchema, cursor: v.string() }))
	.handler(({ data }) =>
		renderToReadableStream(<AddressEventsServer address={data.address} startCursor={data.cursor} />),
	);

export const Route = createFileRoute("/rsc/address-events")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const address = search.get("address");
				if (address === null) throw new Error("Expected request address");

				const cursor = search.get("cursor");
				if (cursor === null) throw new Error("Expected request cursor");

				const stream = await getFlightStream({ data: { address, cursor } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
