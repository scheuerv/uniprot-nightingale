import ProtvistaTrack from "protvista-track";
export interface TrackContainer {
    readonly track: ProtvistaTrack;
    addData(): void;
}

export default class BasicTrackContainer<T> implements TrackContainer {
    constructor(public readonly track: ProtvistaTrack, private readonly data: T) {

    }
    public addData() {
        this.track.data = this.data;
    }
}
export class MainTrackContainer<T> implements TrackContainer {
    constructor(public readonly track: ProtvistaTrack, public readonly emptyTrack: ProtvistaTrack, private readonly data: T) {

    }
    public addData() {
        this.track.data = this.data;
        this.emptyTrack.data = [];
    }
}