import CategoryContainer from "./category-container";

export default class CompositeCategoryContainer implements CategoryContainer{
constructor(private categoryContainers:CategoryContainer[])
{

}
    getContent(): HTMLElement {
        const div =document.createElement("div");
        this.categoryContainers.forEach(categoryContainer=>div.appendChild(categoryContainer.getContent()));
        return  div;
       
    }
    addData(): void {
        this.categoryContainers.forEach(categoryContainer=> categoryContainer.addData());
    }
    
}