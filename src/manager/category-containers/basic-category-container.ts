import $ from "jquery";
import CategoryContainer from "./category-container";
import TrackContainer from "../track-containers/track-container";
import { createEmitter } from "ts-typed-events";
import { Fragment, TrackFragment } from "../../types/accession";
import { HTMLElementWithData, FragmentWrapper } from "../fragment-wrapper";
import { RowWrapper, RowWrapperBuilder } from "../row-wrapper";
import { safeHexColor } from "../../utils/color-utils";

/**
 * Contains track containers with protvista tracks. We assume the first one
 * is the main track and other subtracks. It also manages references
 * between the same fragments in main track and other tracks so when
 * one annotation is highlighted in subtrack its corresponding one is
 * also highlighted in main track (and other way around).
 */
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

    public getFirstTrackContainerWithStructureInfo(): TrackContainer | undefined {
        for (let i = 0; i < this.trackContainers.length; i++) {
            const structureInfo = this.trackContainers[i].getStructureInfo();
            if (structureInfo) {
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

    /**
     * Calls addData on each track (which is supposed to add data to protvista track inside).
     *
     * It also creates RowWrapper and their contents (FragmentWrappers). Each FragmentWrapper
     * contains references to the same fragments on different tracks (typicaly one on main
     * track and other on one of the subtracks).
     *
     */
    public addData(): void {
        this._tracks.forEach((track) => track.addData());
        const map: Map<number, ElementAndBuilder[]> = new Map();
        const mainRowElement = $(this._categoryDiv).find(".un-track-row.main");
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
            .find(".un-subtracks-container .un-track-row")
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
                    fragment.structureInfo
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

    public get trackContainers(): TrackContainer[] {
        return this._tracks;
    }
}

type ElementAndBuilder = {
    readonly element: HTMLElementWithData;
    readonly builder: RowWrapperBuilder;
};
