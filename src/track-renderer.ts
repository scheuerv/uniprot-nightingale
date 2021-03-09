import TrackContainer from './track-container';
export default interface TrackRenderer {
    getMainTrack(): TrackContainer;
    getSubtracks(): TrackContainer[];
}
