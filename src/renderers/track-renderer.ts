import { TrackFragment } from 'src/manager/track-manager';
import { SealedEvent } from 'ts-typed-events';
import CategoryContainer from '../manager/category-container';
export default interface TrackRenderer {
    onArrowClick: SealedEvent<TrackFragment[]>;
    getCategoryContainer(sequence: string): CategoryContainer;
}
