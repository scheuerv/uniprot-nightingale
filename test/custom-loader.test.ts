/**
 * @jest-environment jest-environment-jsdom
 */
import CustomLoader from "../src/manager/builder/loaders/custom-loader";

describe("CustomLoader tests", function () {
    it("basic case", async () => {
        const uniprotId = "P0123";
        const instance = new CustomLoader(() => {
            return { test: 123 };
        });
        await expect(instance.load(uniprotId)).resolves.toEqual({ test: 123 });
    });
});
