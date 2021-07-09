import { Evidence } from "protvista-variation-adapter/dist/es/variants";
import { Xref } from "protvista-variation-adapter/dist/es/variants";

export type Feature = {
    readonly type: string;
    readonly category?: string;
    readonly description?: string;
    readonly alternativeSequence?: string;
    readonly begin: string;
    readonly end: string;
    readonly xrefs?: Xref[];
    readonly evidences?: Evidence[];
    readonly unique?: boolean;
    readonly matchScore?: number;
    readonly color?: string;
};
