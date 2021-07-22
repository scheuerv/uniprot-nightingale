import Loader from "./loader";

/**
 * It simplifies "loading" of static data. We can easily create CustomLoader
 * using lambda function that just returns data (without Promise). This is
 * heavily used when creating fake loaders (loaders which are not really
 * loading anything, because we already have the data) for user data.
 */
export default class CustomLoader<T> implements Loader<T> {
    constructor(private readonly dataLoader: (uniprotId: string) => T) {}
    public load(uniprodId: string): Promise<T> {
        return Promise.resolve(this.dataLoader(uniprodId));
    }
}
