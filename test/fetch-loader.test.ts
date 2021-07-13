/**
 * @jest-environment jest-environment-jsdom
 */
import FetchLoader from "../src/manager/builder/loaders/fetch-loader";
import fetchMock from "jest-fetch-mock";
import mockConsole from "jest-mock-console";

describe("FetchLoader tests", function () {
    beforeAll(() => {
        fetchMock.enableMocks();
    });
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    afterAll(() => {
        fetchMock.disableMocks();
    });
    it("basic case", async () => {
        const uniprotId = "P0123";
        fetchMock.mockResponse((req) => {
            if (req.url == `https://test/${uniprotId}`) {
                return Promise.resolve(JSON.stringify({ test: 123 }));
            }
            return Promise.reject("error");
        });
        const instance = new FetchLoader((uniProtId) => `https://test/${uniProtId}`);
        await expect(instance.load(uniprotId)).resolves.toEqual({ test: 123 });
        expect(fetchMock.mock.calls.length).toEqual(1);
    });

    it("API unavailable", async () => {
        const uniprotId = "P0123";
        const errorMessage = "API error";
        fetchMock.mockResponse(() => {
            return Promise.reject(errorMessage);
        });
        const instance = new FetchLoader((uniProtId) => `https://test/${uniProtId}`);
        const restoreConsole = mockConsole();
        await expect(instance.load(uniprotId)).rejects.toEqual(errorMessage);
        expect(console.error).toHaveBeenCalledWith("API unavailable!", errorMessage);
        expect(fetchMock.mock.calls.length).toEqual(1);
        restoreConsole();
    });
});
