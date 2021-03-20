import TrackRenderer from '../renderers/track-renderer';
export default interface TrackParser {
    parse(uniprotId: string, data: any): Promise<TrackRenderer | null>;

}

