import { Feature } from "protvista-feature-adapter/src/BasicHelper";
import TrackRenderer from "../renderers/track-renderer";
export default interface TrackParser {
    parse(uniprotId: string, data: any): Promise<TrackRenderer[] | null>;
    readonly categoryName: string;
}

export function isErrorResponse(response: ErrorResponse | any): response is ErrorResponse {
    return (response as ErrorResponse).requestedURL !== undefined;
}

export type ErrorResponse = {
    readonly requestedURL: string;
    readonly errorMessage: string;
};

export type ProteinFeatureInfo = {
    readonly sequence: string;
    readonly features: Feature[];
};
