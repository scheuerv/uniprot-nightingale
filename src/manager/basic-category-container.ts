import { ElementWithData, FragmentWrapper, RowWrapper } from "../renderers/basic-track-renderer";
import d3 = require('d3');
import CategoryContainer from "./category-container";
import { TrackContainer } from "./track-container";

export default class BasicCategoryContainer implements CategoryContainer {
    constructor(private tracks: TrackContainer[], private categoryDiv: HTMLDivElement) {

    }
    getContent(): HTMLElement {
        return this.categoryDiv;
    }
    addData() {
        this.tracks.forEach(track => track.addData());
        const map: Map<number, [ElementWithData, RowWrapper][]> = new Map();
        const mainRowElement = d3.select(this.categoryDiv).select('.track-row.main');
        const mainRowWrapper = new RowWrapper(mainRowElement.select('.fa-arrow-circle-right').node() as Element)
        mainRowElement.selectAll('.fragment-group').nodes().forEach(fragment => {
            const fragmentWithData = fragment as ElementWithData;
            map.set(fragmentWithData.__data__.id, [[fragmentWithData, mainRowWrapper]]);
        });
        d3.select(this.categoryDiv).selectAll('.subtracks-container .track-row').nodes().forEach(row => {
            const rowSelection = d3.select(row);
            const rowWrapper = new RowWrapper(rowSelection.select('.fa-arrow-circle-right').node() as Element);
            rowSelection.selectAll('.fragment-group').nodes().forEach(fragment => {
                const fragmentWithData = fragment as ElementWithData;
                map.get(fragmentWithData.__data__.id)?.push([fragmentWithData, rowWrapper]);
            });
        });
        map.forEach((fragmentRowTuples, id) => {
            const fragmentWrapper = new FragmentWrapper(fragmentRowTuples, fragmentRowTuples[0][0].__data__);

            fragmentRowTuples.forEach(fragmentRowTuple => {
                fragmentRowTuple[1].addFragmentWrapper(fragmentWrapper);
                d3.select(fragmentRowTuple[1].arrowElement).on("click", this.arrowClick(fragmentRowTuple[1]));
            })
        });

    }
    arrowClick(row: RowWrapper) {
        return () => {
            d3.event.stopPropagation();
            const clickedArrowClassList = row.arrowElement.classList;
            if (clickedArrowClassList.contains("clicked")) {
                clickedArrowClassList.remove('clicked');
                row.getFragmentWrappers().forEach(fragment => {
                    fragment.fragmentRowTuples.forEach(fragmentRowTuples => {
                        const fragmentClasssList = fragmentRowTuples[0].classList;
                        if (fragmentClasssList.contains('clicked')) {
                            fragmentClasssList.remove('clicked');
                        }
                        const arrowClasssList = fragmentRowTuples[1].arrowElement.classList;
                        if (arrowClasssList.contains('clicked')) {
                            arrowClasssList.remove('clicked');
                        }
                    })
                });
                //this.emitOnArrowClick.emit(getClickedTrackFragments());
            } else {
                clickedArrowClassList.add("clicked");
                row.getFragmentWrappers().forEach(fragment => {
                    fragment.fragmentRowTuples.forEach(fragmentRowTuples => {
                        const fragmentClasssList = fragmentRowTuples[0].classList;
                        if (!fragmentClasssList.contains('clicked')) {
                            fragmentClasssList.add('clicked');
                        }
                    });
                    if (fragment.allFragmentsInRowClicked(fragment.fragmentRowTuples[0][1], 0)) {
                        fragment.fragmentRowTuples[0][1].arrowElement.classList.add('clicked');
                    }
                    if (fragment.allFragmentsInRowClicked(fragment.fragmentRowTuples[1][1], 0)) {
                        fragment.fragmentRowTuples[1][1].arrowElement.classList.add('clicked');
                    }
                    // this.emitOnArrowClick.emit(getClickedTrackFragments());
                });
            }
        }
    }
    getTrackContainers() {
        return this.tracks;
    }
}