import { Feature } from "protvista-feature-adapter/src/BasicHelper";

export type ProteinFeatureInfo = {
    readonly sequence: string;
    readonly features: Feature[];
};
