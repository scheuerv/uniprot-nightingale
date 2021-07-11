import TrackParser from "../parsers/track-parser";
import { fetchWithTimeout } from "../utils/utils";
import PdbParser from "../parsers/pdb-parser";
import FeatureParser from "../parsers/feature-parser";
import SMRParser from "../parsers/SMR-parser";
import VariationParser from "../parsers/variation-parser";
import "overlayscrollbars/css/OverlayScrollbars.min.css";
import TrackRenderer from "../renderers/track-renderer";
import PdbLoader from "../loaders/pdb-loader";
import Loader from "../loaders/loader";
import FetchLoader from "../loaders/fetch-loader";
import CustomLoader from "../loaders/custom-loader";
import { Config, CustomDataSourceFeature } from "../types/config";
import TrackManager from "./track-manager";
import { createEmitter } from "ts-typed-events";
import { VariantWithCategory, VariantWithSources } from "../types/variants";
export default class TrackManagerBuilder {
    private readonly tracks: Track<any>[] = [];
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
            trackManagerBuilder.addCustomTrack(() => {
                return config.sequenceStructureMapping;
            }, new PdbParser("User provided structures", "USER_PROVIDED_STRUCTURES"));
        }

        trackManagerBuilder.addLoaderTrack(new PdbLoader(config.pdbIds), new PdbParser());
        trackManagerBuilder.addFetchTrack(
            (uniprotId) =>
                `https://swissmodel.expasy.org/repository/uniprot/${uniprotId}.json?provider=swissmodel`,
            new SMRParser(config.smrIds)
        );
        trackManagerBuilder.addFetchTrack(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/features/${uniprotId}`,
            new FeatureParser(config.exclusions)
        );
        trackManagerBuilder.addFetchTrack(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniprotId}`,
            new FeatureParser(config.exclusions)
        );
        trackManagerBuilder.addFetchTrack(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/antigen/${uniprotId}`,
            new FeatureParser(config.exclusions)
        );
        trackManagerBuilder.addFetchTrack(
            (uniprotId) => `https://www.ebi.ac.uk/proteins/api/variation/${uniprotId}`,
            new VariationParser(config.overwritePredictions)
        );
        config.customDataSources?.forEach((customDataSource) => {
            if (customDataSource.url) {
                trackManagerBuilder.addFetchTrack(
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
                trackManagerBuilder.addCustomTrack(() => {
                    return {
                        sequence: customDataSource.data.sequence,
                        features: variationFeatures
                    };
                }, new VariationParser(config.overwritePredictions, customDataSource.source));
                trackManagerBuilder.addCustomTrack(() => {
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
            this.tracks.map((track) =>
                track.dataLoader.load(this.uniprotId).then(
                    (data) => {
                        return track.parser.parse(this.uniprotId, data);
                    },
                    (err) => {
                        console.error(`DATA unavailable!`, err);
                        return Promise.reject(err);
                    }
                )
            )
        ).then((renderers) => {
            const filteredRenderes: TrackRenderer[] = renderers
                .map((promiseSettled) => {
                    if (promiseSettled.status == "fulfilled") {
                        return promiseSettled.value;
                    }
                    console.warn(promiseSettled.reason);
                    return null;
                })
                .flatMap((renderer) => renderer)
                .filter((renderer) => renderer != null)
                .map((renderer) => renderer!);
            const trackRenderers = this.sortRenderers(filteredRenderes, this.config?.categoryOrder);

            const trackManager = new TrackManager(
                element,
                sequence,
                trackRenderers.map((trackRenderer) => trackRenderer.getCategoryContainer(sequence))
            );
            this.emitOnRendered.emit();
            return trackManager;
        });
    }

    public addLoaderTrack<T>(dataLoader: Loader<T>, parser: TrackParser<T>): void {
        if (!this.config?.exclusions?.includes(parser.categoryName)) {
            this.tracks.push({ dataLoader: dataLoader, parser });
        }
    }

    public addCustomTrack<T>(dataLoader: (uniprotId: string) => T, parser: TrackParser<T>): void {
        this.addLoaderTrack(new CustomLoader(dataLoader), parser);
    }

    public addFetchTrack<T>(
        urlGenerator: (uniprotId: string) => string,
        parser: TrackParser<T>
    ): void {
        this.addLoaderTrack(new FetchLoader(urlGenerator), parser);
    }

    private sortRenderers(
        filteredRenderes: TrackRenderer[],
        categoryOrder?: string[]
    ): TrackRenderer[] {
        const map = new Map<string, TrackRenderer>();
        filteredRenderes.forEach((renderer) => {
            const previousRenderer = map.get(renderer.categoryName);
            if (previousRenderer) {
                map.set(renderer.categoryName, previousRenderer.combine(renderer));
            } else {
                map.set(renderer.categoryName, renderer);
            }
        });
        const sortedRenderers: TrackRenderer[] = [];
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

type Track<T> = {
    readonly dataLoader: Loader<T>;
    readonly parser: TrackParser<T>;
};
