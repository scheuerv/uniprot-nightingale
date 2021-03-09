// @ts-ignore
import ProtvistaTrack from "protvista-track";
export default class TrackContainer {
    constructor(public track: ProtvistaTrack,private data:any[]) {

    }
    addData() {
        this.track.data = this.data;
    }
}