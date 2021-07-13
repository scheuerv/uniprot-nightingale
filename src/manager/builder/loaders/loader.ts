export default interface Loader<T> {
    load(uniprodId: string): Promise<T>;
}
