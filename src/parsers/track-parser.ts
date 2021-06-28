import { ErrorResponse } from "../types/error-response";
import TrackRenderer from "../renderers/track-renderer";
export default interface TrackParser {
    parse(uniprotId: string, data: any): Promise<TrackRenderer[] | null>;
    readonly categoryName: string;
}

export function isErrorResponse(response: ErrorResponse | any): response is ErrorResponse {
    return (response as ErrorResponse).requestedURL !== undefined;
}
