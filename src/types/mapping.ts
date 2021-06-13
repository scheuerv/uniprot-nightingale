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
