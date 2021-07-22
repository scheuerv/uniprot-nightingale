import BasicCategoryRenderer from "../renderers/basic-category-renderer";
import FragmentAligner from "./fragment-aligner";
import Parser, { isErrorResponse } from "./parser";
import { config as trackConfig } from "protvista-track/src/config";
import { TrackRow } from "../../../types/accession";
import { FeatureFragmentConverter } from "./feature-fragment-converter";
import { FeaturesData } from "../../../types/feature-parser";
import { ErrorResponse } from "../../../types/error-response";
import { categoriesConfig } from "../../../config/feature-categories";
import { Feature } from "../../../types/feature";

export default class FeatureParser implements Parser<FeaturesData> {
    public readonly categoryName = "FEATURES";
    private readonly unique = "UNIQUE";
    private readonly nonUnique = "NON_UNIQUE";
    private readonly featureFragmentConverter: FeatureFragmentConverter;

    constructor(private readonly exclusions?: string[], dataSource?: string) {
        this.featureFragmentConverter = new FeatureFragmentConverter(dataSource);
    }

    /**
     * Takes raw data from api or user and creates objects of type BasicCategoryRenderer,
     * which are used to create html element representing raw data. It groups features
     * according to their categories and types.
     *
     * It excludes specific categories that are given in constructor it also
     * sets data source information to all created fragments according to the
     * constructor parameter.
     */
    public async parse(
        uniprotId: string,
        data: FeaturesData | ErrorResponse
    ): Promise<BasicCategoryRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const categories: Map<string, Map<string, FragmentAligner>> = new Map();
        const features: Feature[] = data.features;
        let id = 0;
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
                typeFeatureFragmentAligner.addFragment(
                    this.featureFragmentConverter.convert(
                        ++id,
                        data.sequence,
                        uniprotId,
                        processedFeature
                    )
                );
            }
        });
        const categoryRenderers: BasicCategoryRenderer[] = [];
        for (const [category, categoryData] of categories.entries()) {
            const typeTrackRows: Map<string, TrackRow> = new Map();
            for (const [type, fragmentAligner] of categoryData) {
                typeTrackRows.set(
                    type,
                    new TrackRow(
                        fragmentAligner.alignFragments(),
                        trackConfig[type]?.label ?? this.createLabel(type)
                    )
                );
            }
            categoryRenderers.push(
                new BasicCategoryRenderer(
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

    /**
     * Proteomics and antigen features are missing category so we are adding
     * them manually.
     */
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
