import ProtvistaTrack from "protvista-track";
export interface TrackContainer {
    addData(): void;
}

export default class BasicTrackContainer<T> implements TrackContainer {
    constructor(public track: ProtvistaTrack, private data: T) {

    }
    addData() {
        this.track.data = this.data;
    }
}
export class MainTrackContainer<T> implements TrackContainer {
    constructor(public track: ProtvistaTrack, public emptyTrack: ProtvistaTrack, private data: T) {

    }
    addData() {
        this.track.data = this.data;
        this.emptyTrack.data = [];
    }
}