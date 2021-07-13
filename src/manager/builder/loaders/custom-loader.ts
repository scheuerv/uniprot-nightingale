import Loader from "./loader";

export default class CustomLoader<T> implements Loader<T> {
    constructor(private readonly dataLoader: (uniprotId: string) => T) {}
    public load(uniprodId: string): Promise<T> {
        return Promise.resolve(this.dataLoader(uniprodId));
    }
}
