import { fetchWithTimeout } from "../../../utils/utils";
import Loader from "./loader";

/**
 * Simplifies creating of loader using lambda function which generates
 * url address from which is data fetched (downloaded) and returned.
 */
export default class FetchLoader<T> implements Loader<T> {
    constructor(private readonly urlGenerator: (uniprotId: string) => string) {}
    public load(uniprodId: string): Promise<T> {
        return fetchWithTimeout(this.urlGenerator(uniprodId), {
            timeout: 8000
        }).then(
            async (data) => {
                return await data.json();
            },
            (err) => {
                console.error(`API unavailable!`, err);
                return Promise.reject(err);
            }
        );
    }
}
