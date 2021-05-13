import CategoryContainer from '../manager/category-container';
export default interface TrackRenderer {
    getCategoryContainer(sequence: string): CategoryContainer;
    readonly categoryName: string;
}
