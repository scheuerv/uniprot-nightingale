import TrackRenderer from './track-renderer';
export default interface TrackParser {
    parse(uniprotId: string, data: any): Promise<TrackRenderer | null>;

}