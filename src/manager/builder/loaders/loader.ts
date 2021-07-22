/**
 * This interface is used for defining data loading objects.
 * Most of them are quite trivial, but there is atleast one more
 * complex PdbLoader. In general we can say that main purpose of
 * implementations of this interface is to load and transform data
 * into the same format as user data so it can be procesed by
 * parser.
 */
export default interface Loader<T> {
    load(uniprodId: string): Promise<T>;
}
