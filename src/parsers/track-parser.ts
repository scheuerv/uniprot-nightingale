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
    readonly errorMessage: string[];
};

export type ProteinFeatureInfo = {
    readonly version?: string;
    readonly accession: string;
    readonly entryName: string;
    readonly proteinName?: string;
    readonly geneName?: string;
    readonly organismName?: string;
    readonly proteinExistence?: string;
    readonly sequence: string;
    readonly sequenceChecksum?: string;
    readonly sequenceVersion?: number;
    readonly geteGeneId?: string;
    readonly geteProteinId?: string;
    readonly taxid?: number;
    readonly features: Feature[];
};

export type Mapping = {
    uniprotStart: number;
    uniprotEnd: number;
    fragmentMappings: FragmentMapping[];
};

export type FragmentMapping = {
    pdbEnd: number;
    pdbStart: number;
    from: number;
    to: number;
};
