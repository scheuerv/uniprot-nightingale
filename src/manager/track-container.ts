// @ts-ignore
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