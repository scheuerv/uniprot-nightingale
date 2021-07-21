import { Interval } from "./interval";
import { Mapping } from "./mapping";
import { TooltipContent } from "./tooltip-content";

export class Accession {
    constructor(public readonly locations: Location[]) {}
}
export class Location {
    constructor(public readonly fragments: Fragment[]) {}
}
export class Fragment {
    constructor(
        public readonly id: number,
        public readonly start: number,
        public readonly end: number,
        public readonly color: string,
        public readonly fill?: string,
        public readonly shape?: string,
        public readonly tooltipContent?: TooltipContent,
        public readonly structureInfo?: StructureInfo
    ) {}
}

export type StructureInfo = {
    readonly pdbId: string;
    readonly chain: string;
    readonly mapping: Mapping;
    readonly url?: string;
    readonly format: "mmcif" | "cifCore" | "pdb" | "pdbqt" | "gro" | "xyz" | "mol" | "sdf" | "mol2";
    readonly data?: string;
    readonly idType: "label" | "auth";
    readonly observedIntervals: Interval[];
    readonly source: "PDB" | "SMR" | "USER";
};

export class TrackRow {
    constructor(
        public readonly rowData: Accession[],
        public readonly label: string,
        public readonly structureInfo?: StructureInfo
    ) {}
}

export type TrackFragment = {
    readonly sequenceStart: number;
    readonly sequenceEnd: number;
    readonly color: string;
};
