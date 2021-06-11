import BasicTrackRenderer, { Fragment, TrackRow } from "../renderers/basic-track-renderer";
import FragmentAligner from "./fragment-aligner";
import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from "./track-parser";
import TrackRenderer from "../renderers/track-renderer";
import { config as trackConfig } from "protvista-track/src/config";
import { getDarkerColor } from "../utils";
import { createFeatureTooltip } from "../tooltip-content";
import { Feature } from "protvista-feature-adapter/src/BasicHelper";
export default class FeatureParser implements TrackParser {
    public readonly categoryName = "FEATURES";
    private readonly unique = "UNIQUE";
    private readonly nonUnique = "NON_UNIQUE";

    constructor(private readonly exclusions?: string[], private readonly dataSource?: string) {}

    public async parse(
        uniprotId: string,
        data: ProteinFeatureInfo | ErrorResponse
    ): Promise<TrackRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const categories: Map<string, Map<string, FragmentAligner>> = new Map();
        const features: Feature[] = data.features;
        let id = 1;
        features.forEach((feature) => {
            const processedFeature: Feature = this.prepareFeature(feature);
            if (
                processedFeature.category &&
                !this.exclusions?.includes(processedFeature.category)
            ) {
                let category: Map<string, FragmentAligner> | undefined = categories.get(
                    processedFeature.category
                );
                if (!category) {
                    category = new Map();
                    categories.set(processedFeature.category, category);
                }
                let typeFeatureFragmentAligner: FragmentAligner | undefined = category.get(
                    feature.type
                );
                if (!typeFeatureFragmentAligner) {
                    typeFeatureFragmentAligner = new FragmentAligner();
                    category.set(processedFeature.type, typeFeatureFragmentAligner);
                }
                const fillColor: string =
                    processedFeature.color ?? trackConfig[processedFeature.type]?.color;
                const borderColor: string = getDarkerColor(fillColor);
                typeFeatureFragmentAligner.addFragment(
                    new Fragment(
                        id++,
                        parseInt(processedFeature.begin),
                        parseInt(processedFeature.end),
                        borderColor,
                        fillColor,
                        trackConfig[processedFeature.type]?.shape,
                        createFeatureTooltip(
                            processedFeature,
                            uniprotId,
                            data.sequence,
                            this.dataSource,
                            undefined
                        )
                    )
                );
            }
        });
        const categoryRenderers: BasicTrackRenderer[] = [];
        for (const [category, categoryData] of categories.entries()) {
            const typeTrackRows: Map<string, TrackRow> = new Map();
            for (const [type, fragmentAligner] of categoryData) {
                typeTrackRows.set(
                    type,
                    new TrackRow(
                        fragmentAligner.getAccessions(),
                        trackConfig[type]?.label ?? this.createLabel(type)
                    )
                );
            }
            categoryRenderers.push(
                new BasicTrackRenderer(
                    typeTrackRows,
                    categoriesConfig[category]?.label
                        ? categoriesConfig[category]?.label
                        : this.createLabel(category),
                    true,
                    category
                )
            );
        }
        if (categories.size > 0) {
            return categoryRenderers;
        } else {
            return null;
        }
    }

    private createLabel(category: string): string {
        return (
            category[0].toUpperCase() +
            category.slice(1, category.length).replace(/_/g, " ").toLowerCase()
        );
    }

    private prepareFeature(feature: Feature): Feature {
        if (feature.type == "PROTEOMICS") {
            let newType: string;
            if (feature.unique) {
                newType = this.unique;
            } else {
                newType = this.nonUnique;
            }
            return {
                ...feature,
                category: "PROTEOMICS",
                type: newType
            };
        } else if (feature.type == "ANTIGEN") {
            return {
                ...feature,
                category: "ANTIGEN"
            };
        }
        return feature;
    }
}

const categoriesConfig: Record<string, { readonly label: string }> = {
    DOMAINS_AND_SITES: {
        label: "Domains & sites"
    },
    MOLECULE_PROCESSING: {
        label: "Molecule processing"
    },
    PTM: {
        label: "PTM"
    },
    SEQUENCE_INFORMATION: {
        label: "Sequence information"
    },
    STRUCTURAL: {
        label: "Structural features"
    },
    MUTAGENESIS: {
        label: "Mutagenesis"
    },
    VARIANTS: {
        label: "Variants"
    },
    ANTIGEN: {
        label: "Antigenic sequences"
    }
};
