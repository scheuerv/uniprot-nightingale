import $ from "jquery";
import CategoryContainer from "./category-container";
import TrackContainer from "./track-container";
import { createEmitter } from "ts-typed-events";
import { Fragment, TrackFragment } from "../types/accession";
import { HTMLElementWithData, FragmentWrapper } from "./fragment-wrapper";
import { RowWrapper, RowWrapperBuilder } from "./row-wrapper";
import { safeHexColor } from "../utils/color-utils";

export default class BasicCategoryContainer implements CategoryContainer {
    private _rowWrappers: RowWrapper[];
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;

    constructor(
        private readonly _tracks: TrackContainer[],
        private readonly _categoryDiv: HTMLElement
    ) {}

    public get content(): HTMLElement {
        return this._categoryDiv;
    }

    public getFirstTrackContainerWithOutput(): TrackContainer | undefined {
        for (let i = 0; i < this.trackContainers.length; i++) {
            const output = this.trackContainers[i].getOutput();
            if (output) {
                return this.trackContainers[i];
            }
        }
    }

    public getMarkedTrackFragments(): TrackFragment[] {
        return this._rowWrappers[0]?.getMarkedTrackFragments() ?? [];
    }

    public getHighlightedTrackFragments(): TrackFragment[] {
        return this._rowWrappers[0]?.getHighlightedTrackFragments() ?? [];
    }

    public clearHighlightedTrackFragments(): void {
        this._rowWrappers[0]?.clearHighlightedTrackFragments();
    }

    public addData(): void {
        this._tracks.forEach((track) => track.addData());
        const map: Map<number, ElementAndBuilder[]> = new Map();
        const mainRowElement = $(this._categoryDiv).find(".track-row.main");
        const rowWrapperBuilders: RowWrapperBuilder[] = [];
        const arrowElement = mainRowElement.find(".fa-arrow-circle-right");
        if (arrowElement.length > 0) {
            const mainRowWrapperBuilder = new RowWrapperBuilder(arrowElement[0]);
            rowWrapperBuilders.push(mainRowWrapperBuilder);
            mainRowElement
                .find(".fragment-group")
                .get()
                .forEach((fragment) => {
                    const fragmentWithData = fragment as HTMLElementWithData;
                    map.set(fragmentWithData.__data__.id, [
                        {
                            element: fragmentWithData,
                            builder: mainRowWrapperBuilder
                        }
                    ]);
                });
        }
        $(this._categoryDiv)
            .find(".subtracks-container .track-row")
            .get()
            .forEach((row: Element) => {
                const rowSelection = $(row);
                const arrowElement = rowSelection.find(".fa-arrow-circle-right");
                if (arrowElement.length > 0) {
                    const rowWrapperBuilder = new RowWrapperBuilder(arrowElement[0]);
                    rowWrapperBuilders.push(rowWrapperBuilder);
                    rowSelection
                        .find(".fragment-group")
                        .get()
                        .forEach((fragment) => {
                            const fragmentWithData = fragment as HTMLElementWithData;
                            map.get(fragmentWithData.__data__.id)?.push({
                                element: fragmentWithData,
                                builder: rowWrapperBuilder
                            });
                        });
                }
            });
        map.forEach((fragmentRowTuples) => {
            const fragment = fragmentRowTuples[0].element.__data__;
            const fragmentWrapper = new FragmentWrapper(
                fragmentRowTuples.map((it) => it.element),
                new Fragment(
                    fragment.id,
                    fragment.start,
                    fragment.end,
                    safeHexColor(fragment.color),
                    fragment.fill,
                    fragment.shape,
                    fragment.tooltipContent,
                    fragment.output
                )
            );
            fragmentRowTuples.forEach((fragmentRowTuple) => {
                fragmentRowTuple.builder.addFragmentWrapper(fragmentWrapper);
            });
        });
        this._rowWrappers = rowWrapperBuilders.map((builder) => {
            return builder.build();
        });
        this._rowWrappers[0]?.onHighlightChange.on((trackFragments) => {
            this.emitOnHighlightChange.emit(trackFragments);
        });
    }

    public get rowWrappers(): RowWrapper[] {
        return this._rowWrappers;
    }

    public get trackContainers(): TrackContainer[] {
        return this._tracks;
    }
}

type ElementAndBuilder = {
    readonly element: HTMLElementWithData;
    readonly builder: RowWrapperBuilder;
};
