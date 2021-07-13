import CategoryContainer from "../manager/category-container";
export default interface CategoryRenderer {
    readonly categoryName: string;
    createCategoryContainer(sequence: string): CategoryContainer;
    combine(other: CategoryRenderer): CategoryRenderer;
}
