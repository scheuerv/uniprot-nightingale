export type Mapping = Record<string, ChainMapping>;

export type ChainMapping = {
    readonly structAsymId: string;
    readonly fragmentMappings: FragmentMapping[];
};

export type FragmentMapping = {
    readonly entityId?: number;
    readonly structureStart: number;
    readonly structureEnd: number;
    readonly sequenceStart: number;
    readonly sequenceEnd: number;
};
