import MProtvistaFilter from "protvista-filter";
import { html, css, CSSResultOrNative, CSSResultArray } from "lit-element";
import { TemplateResult } from "lit-html";
import { VariantWithSources, VariationData } from "../types/variants";
import { FilterCase, FilterVariationData } from "../types/variation-filter";

const ProtvistaFilter = MProtvistaFilter || HTMLElement;
export default class VariationFilter extends ProtvistaFilter {
    public multiFor: Map<
        string,
        | ((filterCase: FilterCase) => (variants: FilterVariationData[]) => FilterVariationData[])
        | ((filterCase: FilterCase) => (variants: VariationData) => VariantWithSources[])
    >;

    public getCheckBox(filterItem: FilterCase): TemplateResult {
        const { name, options } = filterItem;
        const { labels } = options;
        const isCompound = options.colors.length > 1;
        const result = html`
            <label class="protvista_checkbox ${isCompound ? "compound" : ""}" tabindex="0">
                <input
                    type="checkbox"
                    class="protvista_checkbox_input"
                    ?checked="true"
                    .value="${name}"
                    @change="${() => this.toggleFilter(name)}"
                />
                <span
                    class="checkmark"
                    style=${`background: ${
                        isCompound
                            ? `
              linear-gradient(${options.colors[0]},
              ${options.colors[1]})
            `
                            : options.colors[0]
                    };`}
                ></span>
                <div>
                    ${
                        //puts labels on separate lines
                        labels.map((label: string) => {
                            return html`<div class="protvista_checkbox_label">${label}</div>`;
                        })
                    }
                </div>
            </label>
        `;
        return result;
    }

    public static get styles(): (CSSResultOrNative | CSSResultArray)[] {
        return [
            ProtvistaFilter.styles,
            //stretches the checkbox icon so it covers all labels
            css`
                .protvista_checkbox.compound .checkmark {
                    align-self: stretch;
                    height: auto;
                }
            `
        ];
    }

    public toggleFilter(name: string): void {
        if (!this.selectedFilters.has(name)) {
            this.selectedFilters.add(name);
        } else {
            this.selectedFilters.delete(name);
        }
        this.multiFor.forEach((filterFunction, forId) => {
            this.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        type: "filters",
                        handler: "property",
                        for: forId,
                        value: this.filters
                            .filter((filter: FilterCase) => this.selectedFilters.has(filter.name))
                            .map((filter: FilterCase) => ({
                                category: filter.type.name,
                                filterFn: filterFunction(filter)
                            }))
                    }
                })
            );
        });
    }
}
