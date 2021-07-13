import Parser from "./parsers/parser";
import { fetchWithTimeout } from "../../utils/utils";
import PdbParser from "./parsers/pdb-parser";
import FeatureParser from "./parsers/feature-parser";
import SMRParser from "./parsers/SMR-parser";
import VariationParser from "./parsers/variation-parser";
import "overlayscrollbars/css/OverlayScrollbars.min.css";
import CategoryRenderer from "./renderers/category-renderer";
import PdbLoader from "./loaders/pdb-loader";
import Loader from "./loaders/loader";
import FetchLoader from "./loaders/fetch-loader";
import CustomLoader from "./loaders/custom-loader";
import { Config, CustomDataSourceFeature } from "../../types/config";
import TrackManager from "../track-manager";
import { createEmitter } from "ts-typed-events";
import { VariantWithCategory, VariantWithSources } from "../../types/variants";
import { CategoryRenderersProvider } from "./category-renderers-provider";
export default class TrackManagerBuilder {
    private readonly categoryRenderersProviders: CategoryRenderersProvider<any>[] = [];
    private readonly uniprotId: string;
    private readonly emitOnRendered = createEmitter<void>();
    public readonly onRendered = this.emitOnRendered.event;

    constructor(
        private readonly sequenceUrlGenerator: (
            uniprotId: string
        ) => Promise<{ sequence: string; startRow: number }>,
        private readonly config: Config
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

    public static createDefault(config: Config): TrackManagerBuilder {
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
            trackManagerBuilder.addCustomCategoryRendererProvider(() => {
                return config.sequenceStructureMapping;
            }, new PdbParser("User provided structures", "USER_PROVIDED_STRUCTURES"));
        }

        trackManagerBuilder.addLoaderCategoryRendererProvider(
            new PdbLoader(config.pdbIds),
            new PdbParser()
        );
        trackManagerBuilder.addFetchCategoryRendererProvider(
            (uniprotId) =>
                `https://swissmodel.expasy.org/repository/uniprot/${uniprotId}.json?provider=swissmodel`,
            new SMRParser(config.smrIds)
        );
        trackManagerBuilder.addFetchCategoryRendererProvider(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/features/${uniprotId}`,
            new FeatureParser(config.exclusions)
        );
        trackManagerBuilder.addFetchCategoryRendererProvider(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniprotId}`,
            new FeatureParser(config.exclusions)
        );
        trackManagerBuilder.addFetchCategoryRendererProvider(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/antigen/${uniprotId}`,
            new FeatureParser(config.exclusions)
        );
        trackManagerBuilder.addFetchCategoryRendererProvider(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/variation/${uniprotId}`,
            new VariationParser(config.overwritePredictions)
        );
        config.customDataSources?.forEach((customDataSource) => {
            if (customDataSource.url) {
                trackManagerBuilder.addFetchCategoryRendererProvider(
                    (uniprotId) =>
                        `${customDataSource.url}${uniprotId}${
                            customDataSource.useExtension ? ".json" : ""
                        }`,
                    new FeatureParser(config.exclusions, customDataSource.source)
                );
            }
            if (customDataSource.data) {
                const variationFeatures: VariantWithSources[] = [];
                const otherFeatures: CustomDataSourceFeature[] = [];
                customDataSource.data.features.forEach((feature) => {
                    if (feature.category == "VARIATION") {
                        variationFeatures.push(feature as VariantWithCategory);
                    } else {
                        otherFeatures.push(feature);
                    }
                });
                trackManagerBuilder.addCustomCategoryRendererProvider(() => {
                    return {
                        sequence: customDataSource.data.sequence,
                        features: variationFeatures
                    };
                }, new VariationParser(config.overwritePredictions, customDataSource.source));
                trackManagerBuilder.addCustomCategoryRendererProvider(() => {
                    return {
                        sequence: customDataSource.data.sequence,
                        features: otherFeatures
                    };
                }, new FeatureParser(config.exclusions, customDataSource.source));
            }
        });
        return trackManagerBuilder;
    }

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
            const sortedCategoryRenderers = this.sortRenderers(
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

    public addLoaderCategoryRendererProvider<T>(dataLoader: Loader<T>, parser: Parser<T>): void {
        if (!this.config?.exclusions?.includes(parser.categoryName)) {
            this.categoryRenderersProviders.push(new CategoryRenderersProvider(dataLoader, parser));
        }
    }

    public addCustomCategoryRendererProvider<T>(
        dataLoader: (uniprotId: string) => T,
        parser: Parser<T>
    ): void {
        this.addLoaderCategoryRendererProvider(new CustomLoader(dataLoader), parser);
    }

    public addFetchCategoryRendererProvider<T>(
        urlGenerator: (uniprotId: string) => string,
        parser: Parser<T>
    ): void {
        this.addLoaderCategoryRendererProvider(new FetchLoader(urlGenerator), parser);
    }

    private sortRenderers(
        filteredRenderes: CategoryRenderer[],
        categoryOrder?: string[]
    ): CategoryRenderer[] {
        const map = new Map<string, CategoryRenderer>();
        filteredRenderes.forEach((renderer) => {
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
