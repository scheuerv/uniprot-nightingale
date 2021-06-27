import { config } from "protvista-track/src/config";
import ecoMap from "protvista-feature-adapter/src/evidences";
import { groupBy } from "./utils/utils";
import { Association, Prediction, SourceType } from "protvista-variation-adapter/dist/es/variants";
import {
    formatTooltip as featureFormatTooltip,
    DbReferenceObject,
    Feature,
    Evidence
} from "protvista-feature-adapter/src/BasicHelper";
import { existAssociation } from "./utils/variants-utils";
import { TooltipContent } from "./types/tooltip-content";
import { OtherSourceData, VariantWithSources } from "./types/variants";

export interface TooltipData {
    render(): string;
}
class TooltipGeneral implements TooltipData {
    constructor(private readonly content: string) {}

    public render(): string {
        return this.content;
    }
}

class TooltipDataTable implements TooltipData {
    private readonly contentRows: Row[] = [];

    constructor(private readonly title?: string) {}

    public render(): string {
        let content = "<table>";
        content += this.title ? "<tr> <td>" + this.title + "</td></tr>" : "";
        this.contentRows.forEach(
            (row) => (content += "<tr> <td>" + row.label + "</td><td>" + row.content + "</td></tr>")
        );
        return content + "</table>";
    }

    public addRowIfContentDefined(label: string, content: string | undefined): TooltipDataTable {
        if (content) {
            this.contentRows.push(new Row(label, content));
        }
        return this;
    }

    public addEvidenceIfDefined(
        evidences: Evidence[] | undefined,
        uniprotId: string
    ): TooltipDataTable {
        if (evidences) {
            const groupedEvidencesByCode = groupBy(evidences, (evidence) => evidence.code);
            groupedEvidencesByCode.forEach((evidences, code) => {
                const sources = evidences
                    .filter((evidence) => evidence.source)
                    .map((evidence) => evidence.source!);
                const convertedSources: DbReferenceObject[] = convertSources(
                    uniprotId,
                    sources,
                    code
                );
                this.addRowIfContentDefined("Evidence", getEvidenceText(code, convertedSources));
                const groupedSourcesByName: Map<string, DbReferenceObject[]> = groupBy(
                    convertedSources,
                    (source) => source.name
                );
                groupedSourcesByName.forEach((sources: DbReferenceObject[], name: string) => {
                    this.addRowIfContentDefined(
                        "",
                        getEvidenceXRefLinks({
                            sources: sources,
                            name: name,
                            text: (source: DbReferenceObject) => source.id,
                            alternative: false
                        })
                    );
                    if (name === "PubMed") {
                        this.addRowIfContentDefined(
                            "",
                            getEvidenceXRefLinks({
                                sources: sources,
                                name: "EuropePMC",
                                text: (source: DbReferenceObject) => source.id,
                                alternative: true
                            })
                        );
                    }
                });
            });
        }
        return this;
    }

    public addXRefsIfDefined(xrefs?: DbReferenceObject[]): TooltipDataTable {
        if (xrefs) {
            const groupedXrefsByCode = groupBy(
                xrefs.filter((xref) => xref.id != undefined),
                (xref) => xref.id
            );
            let first = true;
            groupedXrefsByCode.forEach((groupedXrefsById, id) => {
                if (first) {
                    this.addRowIfContentDefined(
                        "Cross-references",
                        getEvidenceXRefLinks({
                            sources: groupedXrefsById,
                            name: id,
                            text: (source: DbReferenceObject) => source.name,
                            alternative: false
                        })
                    );
                    first = false;
                } else {
                    this.addRowIfContentDefined(
                        "",
                        getEvidenceXRefLinks({
                            sources: groupedXrefsById,
                            name: id,
                            text: (source: DbReferenceObject) => source.name,
                            alternative: false
                        })
                    );
                }
            });
        }
        return this;
    }

    public addDiseaseAssociationIfDefined(
        associations: Association[] | undefined
    ): TooltipDataTable {
        if (existAssociation(associations)) {
            this.addRowIfContentDefined("Disease Association", "");
            associations?.forEach((association) => {
                if (association.name) {
                    this.addRowIfContentDefined(
                        "Disease",
                        `<span><a href="http://www.uniprot.org/diseases/?query=${association.name}" target="_blank">${association.name}</a></span>`
                    );
                }
                this.addRowIfContentDefined("Description", association.description);
                this.addXRefsIfDefined(association.dbReferences);
            });
        }
        return this;
    }

    public addVariantPredictionsIfDefined(predictions: Prediction[] | undefined): TooltipDataTable {
        predictions?.forEach((prediction) => {
            this.addRowIfContentDefined(
                prediction.predAlgorithmNameType,
                prediction.predictionValType
                    ? `${prediction.predictionValType}${
                          prediction.score != undefined ? `, score: ${prediction.score}` : ""
                      }`
                    : undefined
            );
        });
        return this;
    }

    public isEmpty(): boolean {
        return this.contentRows.length == 0;
    }
}

export default class TooltipContentBuilder {
    private readonly _title: string;
    private readonly data: TooltipData[] = [];
    constructor(label: string) {
        this._title = label;
    }

    public addData<T extends TooltipData>(data: T): T {
        this.data.push(data);
        return data;
    }

    public addDataTable(title?: string): TooltipDataTable {
        const table = new TooltipDataTable(title);
        return this.addData(table);
    }

    public addFeature(feature: Feature): TooltipGeneral {
        const general = new TooltipGeneral(featureFormatTooltip(feature));
        return this.addData(general);
    }

    public build(): TooltipContent {
        return {
            title: this._title,
            content: this.render()
        };
    }
    private render(): string {
        let content = "";
        this.data.forEach((d) => (content += d.render()));
        return content;
    }
}

class Row {
    constructor(public readonly label: string, public readonly content: string) {}
}

export function createBlast(
    about: string,
    start: string | number,
    end: string | number,
    key: string
): string {
    return `<span><a href="http://www.uniprot.org/blast/?about=${about}[${start}-${end}]&key=${key}" target="_blank">BLAST</a>`;
}

export function createFeatureTooltip(
    feature: Feature,
    uniprotId: string,
    sequence: string,
    dataSource?: string,
    type?: string
): TooltipContent {
    const tooltipContent = new TooltipContentBuilder(
        type ??
            feature.type +
                " " +
                feature.begin +
                (feature.begin === feature.end ? "" : "-" + feature.end)
    );
    tooltipContent
        .addDataTable()
        .addRowIfContentDefined("Source", dataSource)
        .addRowIfContentDefined("Description", feature.description)
        .addRowIfContentDefined(
            "Alignment score",
            feature.matchScore ? `${feature.matchScore}%` : undefined
        )
        .addRowIfContentDefined(
            feature.type == "CONFLICT" ? "Conflict" : "Mutation",
            feature.alternativeSequence
                ? sequence.substring(parseInt(feature.begin) - 1, parseInt(feature.end)) +
                      ">" +
                      feature.alternativeSequence
                : undefined
        )
        .addEvidenceIfDefined(feature.evidences, uniprotId)
        .addXRefsIfDefined(feature.xrefs)
        .addRowIfContentDefined("Tools", getFeatureBlast(uniprotId, feature, type));
    return tooltipContent.build();
}

export function createVariantTooltip(
    variant: VariantWithSources,
    uniprotId: string,
    otherSources?: Record<string, OtherSourceData>,
    overwritePredictions?: boolean,
    customSource?: string
): TooltipContent {
    const tooltipContent = new TooltipContentBuilder(
        variant.type +
            " " +
            variant.begin +
            (variant.begin === variant.end ? "" : "-" + variant.end)
    );
    let sourceText: string | undefined = undefined;
    let customSources: string | undefined = undefined;
    if (otherSources) {
        for (const source in otherSources) {
            customSources = customSources ? `${customSources}, ${source}` : source;
        }
    } else if (customSource) {
        customSources = customSource;
    }
    let uniprotEvidences = variant.evidences;
    let lssEvidences = variant.evidences;
    let isUniprot = false;
    let isLss = false;
    if (variant.sourceType == SourceType.Mixed) {
        isUniprot = true;
        isLss = true;
        sourceText =
            "UniProt and large scale studies" +
            `${customSources ? ` custom source(${customSources})` : ""}`;
        uniprotEvidences = [];
        lssEvidences = [];
        variant.evidences?.forEach((evidence) => {
            const eco = ecoMap.filter((record) => record.name == evidence.code)[0];
            if (eco.isManual) {
                uniprotEvidences?.push(evidence);
            } else {
                lssEvidences?.push(evidence);
            }
        });
    } else if (variant.sourceType == SourceType.LargeScaleStudy) {
        uniprotEvidences = undefined;
        isLss = true;
        sourceText =
            "Large scale studies" + `${customSources ? `, custom source (${customSources})` : ""}`;
    } else if (variant.sourceType == SourceType.UniProt) {
        isUniprot = true;
        lssEvidences = undefined;
        sourceText = "UniProt" + `${customSources ? `, custom source (${customSources})` : ""}`;
    } else if (customSources) {
        sourceText = `Custom data (${customSources})`;
    }
    tooltipContent
        .addDataTable()
        .addRowIfContentDefined("Source", sourceText)
        .addRowIfContentDefined(
            "Variant",
            `${
                variant.alternativeSequence
                    ? `${variant.wildType} > ${variant.alternativeSequence}`
                    : undefined
            }`
        );
    if (isUniprot) {
        const uniprotTable = new TooltipDataTable("Uniprot")
            .addRowIfContentDefined("Feature ID", variant.ftId)
            .addEvidenceIfDefined(uniprotEvidences, uniprotId)
            .addRowIfContentDefined("Disease Association", variant.association ? "" : undefined)
            .addDiseaseAssociationIfDefined(variant.association);
        if (!uniprotTable.isEmpty()) {
            tooltipContent.addData(uniprotTable);
        }
    }
    if (isLss) {
        const lssDataTable = new TooltipDataTable("Large Scale Studies").addRowIfContentDefined(
            "Consequence",
            variant.consequenceType
        );
        if (!overwritePredictions || !existsPrediciton(otherSources)) {
            lssDataTable.addVariantPredictionsIfDefined(variant.predictions);
        }
        lssDataTable.addEvidenceIfDefined(lssEvidences, uniprotId).addXRefsIfDefined(variant.xrefs);
        if (!lssDataTable.isEmpty()) {
            tooltipContent.addData(lssDataTable);
        }
    }
    if (otherSources) {
        let predictionsAdded = false;
        for (const source in otherSources) {
            const data = otherSources[source];
            const customSourceDataTable = new TooltipDataTable(source)
                .addRowIfContentDefined("Description", data.description)
                .addRowIfContentDefined("Consequence", data.consequenceType);
            if (overwritePredictions && !predictionsAdded) {
                if (data.predictions) {
                    predictionsAdded = true;
                    customSourceDataTable.addVariantPredictionsIfDefined(data.predictions);
                }
            }
            customSourceDataTable
                .addEvidenceIfDefined(data.evidences, uniprotId)
                .addXRefsIfDefined(data.xrefs);

            if (!customSourceDataTable.isEmpty()) {
                tooltipContent.addData(customSourceDataTable);
            }
        }
    } else if (customSource) {
        const customSourceDataTable = new TooltipDataTable(customSource)
            .addRowIfContentDefined("Description", variant.description)
            .addRowIfContentDefined("Consequence", variant.consequenceType)
            .addVariantPredictionsIfDefined(variant.predictions)
            .addEvidenceIfDefined(variant.evidences, uniprotId)
            .addXRefsIfDefined(variant.xrefs);
        if (!customSourceDataTable.isEmpty()) {
            tooltipContent.addData(customSourceDataTable);
        }
    }

    return tooltipContent.build();
}

function convertSources(
    uniprotId: string,
    sources: DbReferenceObject[],
    code: string
): DbReferenceObject[] {
    const eco = ecoMap.filter((record) => record.name == code)[0];
    const acronym = eco?.acronym;
    if (acronym === "EXP" || acronym === "NAS") {
        const convertedSources = sources.map((source) => {
            if (source.id && source.id.indexOf("ref.") === 0) {
                return {
                    ...source,
                    name: "Citation",
                    url: "http://www.uniprot.org/uniprot/" + uniprotId + "#ref" + source.id.slice(4)
                };
            } else {
                return source;
            }
        });
        return convertedSources;
    }
    return sources;
}

const noBlastTypes = new Set(["helix", "strand", "turn", "disulfid", "crosslnk", "variant"]);
function getFeatureBlast(accession: string, feature: Feature, key?: string) {
    const type = feature.type.toLowerCase();
    if (parseInt(feature.end) - parseInt(feature.begin) >= 3 && !noBlastTypes.has(type)) {
        const featureConfig = key ? config[key] : config[feature.type];
        return createBlast(
            accession,
            feature.begin,
            feature.end,
            featureConfig?.name ? featureConfig.label : convertTypeToLabel(feature.type)
        );
    }
}

function existsPrediciton(otherSources?: Record<string, OtherSourceData>): boolean {
    for (const source in otherSources) {
        const otherSource = otherSources[source];
        if (otherSource.predictions)
            for (const prediction of otherSource.predictions) {
                if (prediction.predictionValType) {
                    return true;
                }
            }
    }
    return false;
}

function convertTypeToLabel(name: string) {
    let label = name.replace(/_/g, " ");
    label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    return label;
}

function getEvidenceText(code: string, sources: DbReferenceObject[]) {
    const eco = ecoMap.filter((record) => record.name == code)[0];
    const acronym = eco?.acronym;
    let publications = sources.filter(
        (source) => source.name == "PubMed" || source.name == "Citation"
    ).length;
    let evidenceText = "";
    if (acronym === "EXP" || acronym === "NAS") {
        publications += sources.filter((source) => {
            if (source.id && source.id.indexOf("ref.") === 0) {
                return true;
            } else {
                return false;
            }
        }).length;

        evidenceText += publications + " " + eco.shortDescription ?? code;
    } else if (acronym === "ISM") {
        evidenceText = sources.length === 0 ? "Sequence Analysis" : sources[0].name + " annotation";
    } else if (acronym === "AA") {
        const unirule = sources.some(
            (source) => source.url && source.url.indexOf("unirule") !== -1
        );
        const saas = sources.some((source) => source.url && source.url.indexOf("SAAS") !== -1);
        const interpro = sources.some((source) => source.name === "Pfam");
        evidenceText = unirule
            ? "UniRule annotation"
            : saas
            ? "SAAS annotation"
            : interpro
            ? "InterPro annotation"
            : sources
            ? sources[0].name + " annotation"
            : "Automatic annotation";
    } else {
        evidenceText = eco?.shortDescription ?? code;
    }
    return evidenceText + (eco?.description ? " (" + eco.description + ")" : "");
}

function getEvidenceXRefLinks(info: {
    sources: DbReferenceObject[];
    name: string;
    text: (source: DbReferenceObject) => string;
    alternative: boolean;
}) {
    let text = info.name + " ";
    info.sources.forEach((source, i) => {
        const url = info.alternative === true ? source.alternativeUrl : source.url;
        text += '<span><a href="' + url + '" target="_blank">' + info.text(source) + "</a></span>";
        if (i !== info.sources.length - 1) {
            text += "<span>|</span>";
        }
    });
    return text;
}
