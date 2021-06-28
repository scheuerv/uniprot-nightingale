export type PDBMappingData = Record<string, Record<string, Record<string, PDBMappingItem[]>>>;

export type PDBMappingItem = {
    readonly entity_id: number;
    readonly end: {
        readonly residue_number: number;
    };
    readonly start: {
        readonly residue_number: number;
    };
    readonly chain_id: string;
    readonly unp_end: number;
    readonly unp_start: number;
    readonly struct_asym_id: string;
};

export type PDBLoaderData = Record<string, readonly PDBLoaderItem[]>;

export type PDBLoaderItem = {
    readonly end: number;
    readonly chain_id: string;
    readonly pdb_id: string;
    readonly start: number;
    readonly unp_end: number;
    readonly coverage?: number;
    readonly unp_start: number;
    readonly experimental_method?: string;
    readonly tax_id?: number;
};

export type PDBLoaderItemAgg = PDBLoaderItem & {
    readonly tax_ids: number[];
};
