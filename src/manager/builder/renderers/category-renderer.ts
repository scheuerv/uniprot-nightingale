import CategoryContainer from "../../category-containers/category-container";
/**
 * This interface provides a way to create CategoryContainer and combine data
 * from different parsers which are supposed to be inside same category.
 */
export default interface CategoryRenderer {
    readonly categoryName: string;
    createCategoryContainer(sequence: string): CategoryContainer;
    combine(other: CategoryRenderer): CategoryRenderer;
}
