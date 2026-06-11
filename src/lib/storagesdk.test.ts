import { storageAdapterTestSuite } from "@storagesdk/adapters/test-suite";

import { r2 } from "./storagesdk";
import { env } from "cloudflare:workers";

storageAdapterTestSuite({
	name: "r2-binding",
	adapter: () => r2({ binding: env.BUCKET }),
});
