export type SMRData = {
    readonly result: SMRResult;
};

export type SMRResult = {
    readonly structures: SMRStructure[];
};

export type SMRStructure = {
    readonly chains: SMRChain[];
    readonly coordinates: string;
    readonly from: number;
    readonly method?: string;
    readonly provider: string;
    readonly template: string;
    readonly to: number;
};
export type SMRChain = {
    readonly id: string;
    readonly segments: SMRSegment[];
};
export type SMRSegment = {
    readonly uniprot: {
        readonly from: number;
        readonly to: number;
    };
};
