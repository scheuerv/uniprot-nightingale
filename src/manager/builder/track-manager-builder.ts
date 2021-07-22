import Parser from "./parsers/parser";
import { fetchWithTimeout } from "../../utils/utils";
import PdbParser from "./parsers/pdb-parser";
import FeatureParser from "./parsers/feature-parser";
import SMRParser from "./parsers/SMR-parser";
import VariationParser from "./parsers/variation-parser";
import CategoryRenderer from "./renderers/category-renderer";
import PdbLoader from "./loaders/pdb-loader";
import Loader from "./loaders/loader";
import FetchLoader from "./loaders/fetch-loader";
import CustomLoader from "./loaders/custom-loader";
import { SequenceConfig, CustomDataSourceFeature } from "../../types/config";
import TrackManager from "../track-manager";
import { createEmitter } from "ts-typed-events";
import { VariantWithCategory, VariantWithSources } from "../../types/variants";
import { CategoryRenderersProvider } from "./category-renderers-provider";

/**
 * Main purpose of this class is to create TrackManager. It can contain
 * several CategoryRenderersProviders, which are used to create content
 * of TrackManager. We can simply add new CategoryRenderersProvider
 * using several convinient add* methods.
 */
export default class TrackManagerBuilder {
    private readonly categoryRenderersProviders: CategoryRenderersProvider<any>[] = [];
    private readonly uniprotId: string;
    private readonly emitOnRendered = createEmitter<void>();
    public readonly onRendered = this.emitOnRendered.event;

    constructor(
        private readonly sequenceUrlGenerator: (
            uniprotId: string
        ) => Promise<{ sequence: string; startRow: number }>,
        private readonly config: SequenceConfig
    ) {
        if (config.uniprotId) {
            if (config.sequence) {
                throw new Error("UniProt ID and sequence are mutually exclusive!");
            }
            this.uniprotId = config.uniprotId;
        } else if (!config.sequence) {
            throw new Error("UniProt ID or sequence is missing!");
        }
        if (config?.sequence && !config.sequenceStructureMapping) {
            throw new Error("Sequence-structure mapping is missing!");
        }
    }

    /**
     * Creates TrackManagerBuilder with default settings. If you dont know
     * how to create TrackManagerBuilder use this method.
     *
     * It uses several public api endpoints to load most commonly used
     * annotations and list of pdb/smr structures and their mapping and
     * coverage. TrackMangerBuilder created by this method can also
     * manage user data.
     */
    public static createDefault(config: SequenceConfig): TrackManagerBuilder {
        const trackManagerBuilder = new TrackManagerBuilder(
            (uniprotId) =>
                config.sequence
                    ? Promise.resolve({
                          sequence: config.sequence,
                          startRow: 0
                      })
                    : fetchWithTimeout(`https://www.uniprot.org/uniprot/${uniprotId}.fasta`, {
                          timeout: 8000
                      })
                          .then((data) => data.text())
                          .then((sequence) => {
                              return {
                                  sequence: sequence,
                                  startRow: 1
                              };
                          }),
            config
        );
        if (config.sequenceStructureMapping) {
            trackManagerBuilder.addCustom(() => {
                return config.sequenceStructureMapping;
            }, new PdbParser(true, "User provided structures", "USER_PROVIDED_STRUCTURES"));
        }

        trackManagerBuilder.add(new PdbLoader(config.pdbIds), new PdbParser());
        trackManagerBuilder.addFetch(
            (uniprotId) =>
                `https://swissmodel.expasy.org/repository/uniprot/${uniprotId}.json?provider=swissmodel`,
            new SMRParser(config.smrIds)
        );
        trackManagerBuilder.addFetch(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/features/${uniprotId}`,
            new FeatureParser(config.categoryExclusions)
        );
        trackManagerBuilder.addFetch(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniprotId}`,
            new FeatureParser(config.categoryExclusions)
        );
        trackManagerBuilder.addFetch(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/antigen/${uniprotId}`,
            new FeatureParser(config.categoryExclusions)
        );
        trackManagerBuilder.addFetch(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/variation/${uniprotId}`,
            new VariationParser(config.overwritePredictions)
        );
        config.customDataSources?.forEach((customDataSource) => {
            if (!customDataSource.url && !customDataSource.data) {
                throw new Error("Url or data is missing in custom data source!");
            }
            if (customDataSource.url) {
                trackManagerBuilder.addFetch(
                    (uniprotId) =>
                        `${customDataSource.url}${uniprotId ?? ""}${
                            customDataSource.useExtension ? ".json" : ""
                        }`,
                    new FeatureParser(config.categoryExclusions, customDataSource.source)
                );
            }
            const customData = customDataSource.data;
            if (customData) {
                const variationFeatures: VariantWithSources[] = [];
                const otherFeatures: CustomDataSourceFeature[] = [];
                customData.features.forEach((feature) => {
                    if (feature.category == "VARIATION") {
                        variationFeatures.push(feature as VariantWithCategory);
                    } else {
                        otherFeatures.push(feature);
                    }
                });
                trackManagerBuilder.addCustom(() => {
                    return {
                        sequence: customData.sequence,
                        features: variationFeatures
                    };
                }, new VariationParser(config.overwritePredictions, customDataSource.source));
                trackManagerBuilder.addCustom(() => {
                    return {
                        sequence: customData.sequence,
                        features: otherFeatures
                    };
                }, new FeatureParser(config.categoryExclusions, customDataSource.source));
            }
        });
        return trackManagerBuilder;
    }

    /**
     * This method loads and prepares data for TrackManager and then it creates one.
     *
     * Data are loaded and prepared mostly using CategoryRenderersProviders inside
     * TrackManagerBuilder.
     *
     * When done it emits onRendered event.
     */
    public async load(element: HTMLElement): Promise<TrackManager> {
        const sequence = await this.sequenceUrlGenerator(this.uniprotId).then((data) => {
            const tokens: string[] = data.sequence.split(/\r?\n/);
            let sequence = "";
            for (let i = data.startRow; i < tokens.length; i++) {
                sequence += tokens[i];
            }
            return sequence;
        });

        return await Promise.allSettled(
            this.categoryRenderersProviders.map((categoryRenderersProvider) => {
                return categoryRenderersProvider.provide(this.uniprotId);
            })
        ).then((categoryRenderers) => {
            const filteredCategoryRenderes: CategoryRenderer[] = categoryRenderers
                .map((promiseSettled) => {
                    if (promiseSettled.status == "fulfilled") {
                        return promiseSettled.value;
                    }
                    console.warn(promiseSettled.reason);
                    return null;
                })
                .flatMap((categoryRenderer) => categoryRenderer)
                .filter((categoryRenderer) => categoryRenderer != null)
                .map((categoryRenderer) => categoryRenderer!);
            const sortedCategoryRenderers = this.sortAndCombineRenderers(
                filteredCategoryRenderes,
                this.config?.categoryOrder
            );

            const trackManager = new TrackManager(
                element,
                sequence,
                sortedCategoryRenderers.map((categoryRenderer) =>
                    categoryRenderer.createCategoryContainer(sequence)
                )
            );
            this.emitOnRendered.emit();
            return trackManager;
        });
    }

    public add<T>(dataLoader: Loader<T>, parser: Parser<T>): void {
        if (!this.config?.categoryExclusions?.includes(parser.categoryName)) {
            this.categoryRenderersProviders.push(new CategoryRenderersProvider(dataLoader, parser));
        }
    }

    public addCustom<T>(dataLoader: (uniprotId: string) => T, parser: Parser<T>): void {
        this.add(new CustomLoader(dataLoader), parser);
    }

    public addFetch<T>(urlGenerator: (uniprotId: string) => string, parser: Parser<T>): void {
        this.add(new FetchLoader(urlGenerator), parser);
    }

    /**
     * Combines renderers with same category name and sorts them according
     * to the configuration.
     */
    private sortAndCombineRenderers(
        renderes: CategoryRenderer[],
        categoryOrder?: string[]
    ): CategoryRenderer[] {
        const map = new Map<string, CategoryRenderer>();
        renderes.forEach((renderer) => {
            const previousRenderer = map.get(renderer.categoryName);
            if (previousRenderer) {
                map.set(renderer.categoryName, previousRenderer.combine(renderer));
            } else {
                map.set(renderer.categoryName, renderer);
            }
        });
        const sortedRenderers: CategoryRenderer[] = [];
        categoryOrder?.forEach((categoryName) => {
            const renderer = map.get(categoryName);
            if (renderer) {
                sortedRenderers.push(renderer);
                map.delete(categoryName);
            }
        });
        map.forEach((renderer) => {
            sortedRenderers.push(renderer);
        });
        return sortedRenderers;
    }
}
