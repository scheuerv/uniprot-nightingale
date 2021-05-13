import TrackRenderer from '../renderers/track-renderer';
export default interface TrackParser {
    parse(uniprotId: string, data: any): Promise<TrackRenderer | null>;
    readonly categoryName: string;
}

export function isErrorResponse(response: ErrorResponse | any): response is ErrorResponse {
    return (response as ErrorResponse).requestedURL !== undefined;
}


export type ErrorResponse = {
    readonly requestedURL: string,
    readonly errorMessage: string[]
}

export type ProteinFeatureInfo = {
    readonly version?: string,
    readonly accession: string,
    readonly entryName: string,
    readonly proteinName?: string,
    readonly geneName?: string,
    readonly organismName?: string,
    readonly proteinExistence?: string,
    readonly sequence: string,
    readonly sequenceChecksum?: string,
    readonly sequenceVersion?: number,
    readonly geteGeneId?: string,
    readonly geteProteinId?: string,
    readonly taxid?: number,
    readonly features: Feature[]
};
export type Feature = {
    readonly type: string,
    readonly category?: 'MOLECULE_PROCESSING' | 'STRUCTURAL' | 'DOMAINS_AND_SITES' | 'MUTAGENESIS' | 'PTM' | 'SEQUENCE_INFORMATION' | 'TOPOLOGY' | 'VARIANTS',
    readonly cvId?: string,
    readonly ftId?: string,
    readonly description?: string,
    readonly alternativeSequence?: string,
    readonly begin: string,
    readonly end: string,
    readonly molecule?: string,
    readonly xrefs?: DbReferenceObject[],
    readonly evidences?: Evidence[]
    readonly unique?: boolean;
    readonly matchScore?: number;
};
export type DbReferenceObject = {
    readonly name: string,
    readonly id: string,
    readonly url: string,
    readonly alternativeUrl?: string,
    readonly reviewed?: boolean,
    readonly properties?: any
};
type Evidence = {
    readonly code: string,
    readonly label?: string,
    readonly source?: DbReferenceObject
}

export type Mapping = {
    uniprotStart: number, uniprotEnd: number, fragmentMappings: FragmentMapping[]
}
export type FragmentMapping = {
    pdbEnd: number,
    pdbStart: number,
    from: number,
    to: number
}