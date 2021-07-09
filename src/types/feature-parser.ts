import { Feature } from "./feature";

export type ProteinFeatureInfo = {
    readonly sequence: string;
    readonly features: Feature[];
};
