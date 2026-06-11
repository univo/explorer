import { storageAdapterTestSuite } from "@storagesdk/adapters/test-suite";

import { r2 } from "./storagesdk";

storageAdapterTestSuite({
	name: "r2-binding",
	adapter: () => r2({ binding: undefined }),
});
