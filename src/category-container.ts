import TrackContainer from "./track-container";
export default class CategoryContainer {
    constructor(public tracks: TrackContainer[],public categoryDiv:HTMLDivElement) {

    }
    addData() {
        this.tracks.forEach(track=>track.addData());
    }
}