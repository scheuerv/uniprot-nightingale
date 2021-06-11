import CategoryContainer from "../manager/category-container";
export default interface TrackRenderer {
    readonly categoryName: string;
    getCategoryContainer(sequence: string): CategoryContainer;
    combine(other: TrackRenderer): TrackRenderer;
}
