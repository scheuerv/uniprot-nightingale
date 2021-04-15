import CategoryContainer from "./category-container";

export default class CompositeCategoryContainer implements CategoryContainer {
    constructor(private categoryContainers: CategoryContainer[]) {

    }
    get trackContainers() {
        return this.categoryContainers.flatMap(categoryContainer => categoryContainer.trackContainers);
    }
    get content() {
        const div = document.createElement("div");
        this.categoryContainers.forEach(categoryContainer => div.appendChild(categoryContainer.content));
        return div;

    }
    addData(): void {
        this.categoryContainers.forEach(categoryContainer => categoryContainer.addData());
    }

}