export type ParserMapping = Record<string, ParserChainMapping>;

export type ParserChainMapping = {
    readonly struct_asym_id: string;
    readonly fragment_mappings: ParserFragmentMapping[];
};

export type ParserFragmentMapping = {
    readonly entity_id?: number;
    readonly start: {
        readonly residue_number: number;
    };
    readonly end: {
        readonly residue_number: number;
    };
    readonly unp_start: number;
    readonly unp_end: number;
};
