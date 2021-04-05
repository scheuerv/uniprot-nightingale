import { config } from "protvista-track/src/config";
import { DbReferenceObject, Feature } from "./parsers/track-parser";
import ecoMap from "protvista-feature-adapter/src/evidences";
import { groupBy } from "./utils";

export default class TooltipContent {
    private readonly title: string;
    private readonly contentRows: Row[] = [];
    constructor(label: string) {
        this.title = label;
    }
    public addRowIfContentDefined(label: string, content: string | undefined) {
        if (content) { this.contentRows.push(new Row(label, content)); }
    }
    public render(): string {
        let content = "<table>";
        this.contentRows.forEach(row =>
            content += '<tr> <td>' + row.label + '</td><td>' + row.content + '</td></tr>'
        )
        return content + '</table>';
    }
    public getTitle() {
        return this.title;
    }
    addEvidenceIfDefined(feature: Feature, uniprotId: string) {
        if (feature.evidences) {
            const groupedEvidencesByCode = groupBy(
                feature.evidences,
                evidence => evidence.code
            );
            groupedEvidencesByCode.forEach((evidences, code) => {
                const sources = evidences.filter(evidence => evidence.source).map(evidence => evidence.source!);
                const convertedSources: DbReferenceObject[] = convertSources(uniprotId, sources, code);
                this.addRowIfContentDefined('Evidence', getEvidenceText(code, convertedSources))
                let groupedSourcesByName: Map<string, DbReferenceObject[]> = groupBy(convertedSources, source => source.name);
                groupedSourcesByName.forEach((sources: DbReferenceObject[], name: string) => {
                    this.addRowIfContentDefined('', getEvidenceXRefLinks({ sources: sources, name: name, text: (source: DbReferenceObject) => source.id, alternative: false }));
                    if (name === 'PubMed') {
                        this.addRowIfContentDefined('', getEvidenceXRefLinks({ sources: sources, name: 'EuropePMC', text: (source: DbReferenceObject) => source.id, alternative: true }));
                    }
                });
            });
        }
    }
    addXRefsIfDefined(feature: Feature) {
        if (feature.xrefs) {
            const groupedXrefsByCode = groupBy(
                feature.xrefs.filter(xref => xref.id != undefined),
                xref => xref.id
            );
            let first = true;
            groupedXrefsByCode.forEach((groupedXrefsById, id) => {
                if (first) {
                    this.addRowIfContentDefined('Cross-references', getEvidenceXRefLinks({ sources: groupedXrefsById, name: id, text: (source: DbReferenceObject) => source.name, alternative: false }));
                    first = false;
                }
                else {
                    this.addRowIfContentDefined('', getEvidenceXRefLinks({ sources: groupedXrefsById, name: id, text: (source: DbReferenceObject) => source.name, alternative: false }));
                }
            });
        }
    }

}
class Row {
    constructor(public label: string, public content: string) {

    }

}

function convertSources(uniprotId: string, sources: DbReferenceObject[], code: string): DbReferenceObject[] {
    const eco = ecoMap.filter((record) => record.name == code)[0];
    const acronym = eco.acronym;
    if ((acronym === 'EXP') || (acronym === 'NAS')) {
        const convertedSources = sources.map(source => {
            if (source.id && (source.id.indexOf('ref.') === 0)) {
                return { ...source, name: 'Citation', url: 'http://www.uniprot.org/uniprot/' + uniprotId + '#ref' + source.id.slice(4) };
            } else {
                return source
            }
        });
        return convertedSources
    }
    return sources;
}
function getFeatureBlast(accession: string, feature: Feature, key?: string) {
    const noBlastTypes = ['helix', 'strand', 'turn', 'disulfid', 'crosslnk', 'variant'];
    const type = feature.type.toLowerCase();
    if ((parseInt(feature.end) - parseInt(feature.begin)) >= 3 && !noBlastTypes.includes(type)) {
        const featureConfig = key ? config[key] : config[feature.type];
        return createBlast(accession, feature.begin, feature.end, featureConfig?.name ? featureConfig.label : convertTypeToLabel(feature.type));
    }
}
export function createBlast(about: string, start: string | number, end: string | number, key: string) {
    return `<span><a href="http://www.uniprot.org/blast/?about=${about}[${start}-${end}]&key=${key}" target="_blank">BLAST</a>`;
}
export function createFeatureTooltip(feature: Feature, uniprotId: string, sequence: string, type?: string) {
    const tooltipContent = new TooltipContent(type ?? feature.type + " " + feature.begin + (feature.begin === feature.end ? "" : ("-" + feature.end)));
    tooltipContent.addRowIfContentDefined('Description', feature.description);
    tooltipContent.addRowIfContentDefined(feature.type == 'CONFLICT' ? 'Conflict' : 'Mutation', feature.alternativeSequence ? sequence.substring(parseInt(feature.begin) - 1, parseInt(feature.end)) + '>' + feature.alternativeSequence : undefined);
    tooltipContent.addEvidenceIfDefined(feature, uniprotId);
    tooltipContent.addXRefsIfDefined(feature);
    tooltipContent.addRowIfContentDefined('Tools', getFeatureBlast(uniprotId, feature, type));
    return tooltipContent;
}

function convertTypeToLabel(name: string) {
    var label = name.replace(/_/g, ' ');
    label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    return label;
}
function getEvidenceText(code: string, sources: DbReferenceObject[]) {
    const eco = ecoMap.filter((record) => record.name == code)[0];
    const acronym = eco.acronym;
    let publications = sources.filter((source) => source.name == 'PubMed' || source.name == 'Citation').length;
    let evidenceText = '';
    if ((acronym === 'EXP') || (acronym === 'NAS')) {
        publications += sources.filter((source) => {
            if (source.id && (source.id.indexOf('ref.') === 0)) {
                return true;
            } else {
                return false;
            }
        }).length;

        if (publications > 0) {
            evidenceText = publications + " ";
        }
        evidenceText += eco.shortDescription;
    } else if (acronym === 'ISM') {
        evidenceText = sources.length === 0 ? 'Sequence Analysis' : sources[0].name + ' annotation';
    }
    else if (acronym === 'AA') {
        const unirule = sources.some(source => source.url && (source.url.indexOf('unirule') !== -1));
        const saas = sources.some(source => source.url && (source.url.indexOf('SAAS') !== -1));
        const interpro = sources.some(source => source.name === 'Pfam');
        evidenceText = unirule ? 'UniRule annotation' :
            saas ? 'SAAS annotation' :
                interpro ? 'InterPro annotation' :
                    sources ? sources[0].name + ' annotation' : 'Automatic annotation';
    } else {
        evidenceText = eco.shortDescription ? eco.shortDescription : code;
    }
    return evidenceText + (eco.description ? ' (' + eco.description + ')' : '');
};
function getEvidenceXRefLinks(info: { sources: DbReferenceObject[], name: string, text: (source: DbReferenceObject) => string, alternative: boolean }) {
    let text = info.name + ' ';
    info.sources.forEach((source, i) => {
        var url = info.alternative === true ? source.alternativeUrl : source.url;
        text += '<span><a href="' + url + '" target="_blank">' + info.text(source) + '</a></span>';
        if (i !== (info.sources.length - 1)) {
            text += '<span>|</span>';
        }
    });
    return text;
};
