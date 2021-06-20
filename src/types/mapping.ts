export type Mapping = FragmentMapping[];

export type FragmentMapping = {
    readonly start: {
        readonly residue_number: number;
    };
    readonly end: {
        readonly residue_number: number;
    };
    readonly unp_start: number;
    readonly unp_end: number;
};
