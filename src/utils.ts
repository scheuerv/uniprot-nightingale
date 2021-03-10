import d3 = require("d3");

const loadComponent = function(name: string, className: CustomElementConstructor) {
    if (!customElements.get(name)) {
        customElements.define(name, className);
    }
};

function createRow(label: HTMLElement, content: HTMLElement, customClass: string = "") {
    let row = d3.create("div")
        .attr("class", "track-row");
    row.append("div").attr("class", "track-label " + customClass).node()?.appendChild(label);
    row.append("div").attr("class", "track-content " + customClass).node()?.appendChild(content);
    return row;
}
export { loadComponent, createRow };