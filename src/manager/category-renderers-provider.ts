import Loader from "../loaders/loader";
import Parser from "../parsers/parser";
import CategoryRenderer from "../renderers/category-renderer";

export class CategoryRenderersProvider<T> {
    constructor(private readonly dataLoader: Loader<T>, private readonly parser: Parser<T>) {}
    public async provide(uniprotId: string): Promise<CategoryRenderer[] | null> {
        return this.dataLoader.load(uniprotId).then(
            (data) => {
                return this.parser.parse(uniprotId, data);
            },
            (err) => {
                console.error(`DATA unavailable!`, err);
                return Promise.reject(err);
            }
        );
    }
}
