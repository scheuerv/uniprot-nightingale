import CategoryContainer from './category-container';
export default interface TrackRenderer {
    getCategoryContainer(sequence:string):CategoryContainer;
}
