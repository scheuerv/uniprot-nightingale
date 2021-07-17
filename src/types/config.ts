import { Feature } from "./feature";
import { PDBParserData } from "./pdb-parser";
import { VariantWithCategory } from "./variants";

export type SequenceConfig = {
    readonly uniprotId?: string;
    readonly pdbIds?: string[];
    readonly smrIds?: string[];
    readonly categoryOrder?: string[];
    readonly categoryExclusions?: string[];
    readonly customDataSources?: CustomDataSource[];
    readonly overwritePredictions?: boolean;
    readonly sequence?: string;
    readonly sequenceStructureMapping?: PDBParserData;
};

export type CustomDataSource = {
    readonly source: string;
    readonly useExtension?: boolean;
    readonly url?: string;
    readonly data?: CustomDataSourceData;
};

export type CustomDataSourceData = {
    readonly sequence: string;
    readonly features: CustomDataSourceFeature[];
};

export type CustomDataSourceFeature = Feature | VariantWithCategory;
