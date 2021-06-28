import { ParserMapping } from "./parser-mapping";

export type PDBParserData = PDBParserItem[];

export type PDBParserItem = {
    readonly end: number;
    readonly chain_id: string;
    readonly pdb_id: string;
    readonly start: number;
    readonly unp_end: number;
    readonly coverage?: number;
    readonly polymer_coverage: PolymerCoverage;
    readonly unp_start: number;
    readonly experimental_method?: string;
    readonly tax_id?: number;
    readonly tax_ids?: number[];
    readonly structure: StructureData;
    readonly mappings: ParserMapping;
};

export type StructureData = {
    format: "mmcif" | "pdb";
    data?: string;
    uri?: string;
};

export type PolymerCoverage = Record<
    string,
    {
        readonly molecules: Molecule[];
    }
>;

export type Molecule = {
    readonly entity_id: number;
    readonly chains: ChainData[];
};

export type ChainData = {
    readonly observed: Observed[];
    readonly chain_id: string;
};

export type Observed = {
    readonly start: {
        readonly residue_number: number;
    };
    readonly end: {
        readonly residue_number: number;
    };
};
