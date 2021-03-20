declare module 'protvista-filter' {
    export = ProtvistaFilter;
    import { LitElement, CSSResultOrNative, CSSResultArray } from "lit-element";
    import { FilterCase } from "src/variation-filter";
    class ProtvistaFilter extends LitElement {
        selectedFilters: Set<string>;
        filters: FilterCase[];
        constructor();
        toggleFilter(name: string): void;
        static get styles(): CSSResultOrNative | CSSResultArray;
    }
}