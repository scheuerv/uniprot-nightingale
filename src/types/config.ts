import { Feature } from "protvista-feature-adapter/src/BasicHelper";
import { PDBParserItem } from "./pdb-parser";

export type Config = {
    readonly uniprotId: string;
    readonly pdbIds?: string[];
    readonly smrIds?: string[];
    readonly categoryOrder?: string[];
    readonly exclusions?: string[];
    readonly customDataSources?: CustomDataSource[];
    readonly overwritePredictions?: boolean;
    readonly sequence?: string;
    readonly sequenceStructureMapping?: PDBParserItem;
};

export type CustomDataSource = {
    readonly source: string;
    readonly useExtension?: boolean;
    readonly url?: string;
    readonly data: CustomDataSourceData;
};

export type CustomDataSourceData = {
    readonly sequence: string;
    readonly features: CustomDataSourceFeature[];
};

export type CustomDataSourceFeature = Feature & {
    readonly category: string;
};
