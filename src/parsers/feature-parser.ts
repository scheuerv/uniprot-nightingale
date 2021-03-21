import BasicTrackRenderer, { Fragment, TrackRow } from "../renderers/basic-track-renderer";
import CompositeTrackRenderer from "../renderers/composite-track-renderer";
import FragmentAligner from "./fragment-aligner";
import TrackParser from "./track-parser";
import TrackRenderer from "../renderers/track-renderer";
import { config } from "protvista-track/src/config";
import { getDarkerColor, groupBy, groupByAndMap } from "../utils";
import TooltipContent from "../tooltip-content";
import ecoMap from "protvista-feature-adapter/src/evidences";
import { createEmitter } from "ts-typed-events";
export default class FeatureParser implements TrackParser<FeatureOutput> {
    private emitOnDataLoaded = createEmitter<FeatureOutput[]>();
    public onDataLoaded = this.emitOnDataLoaded.event;
    async parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {
        const categories: Map<string, Map<string, FragmentAligner>> = new Map();
        const features = data.features;
        features.forEach((feature: { category: string; type: string; begin: string; end: string; ftId: string | undefined; description: string | undefined; evidences: [{ code: string, source: { name: string, id: string, url: string, alternativeUrl: string } | undefined }] }) => {
            let category = categories.get(feature.category);
            if (!category) {
                category = new Map();
                categories.set(feature.category, category);
            }
            let typeFeatureAligner = category.get(feature.type)
            if (!typeFeatureAligner) {
                typeFeatureAligner = new FragmentAligner(feature.type);
                category.set(feature.type, typeFeatureAligner);
            }
            const fillColor = config[feature.type]?.color;
            const borderColor = getDarkerColor(fillColor);

            const tooltipContent = new TooltipContent(feature.type + " " + feature.begin + (feature.begin === feature.end ? "" : ("-" + feature.end)));
            tooltipContent.addRow('Feature ID', feature.ftId);
            tooltipContent.addRow('Description', feature.description);
            if (feature.evidences) {
                const groupedEvidencesByCode = groupByAndMap(
                    feature.evidences.filter(evidence => evidence.source != undefined),
                    evidence => evidence.code,
                    evidence => evidence.source!
                );
                groupedEvidencesByCode.forEach((sources, code) => {
                    tooltipContent.addRow('Evidence', this.getEvidenceText(uniprotId, code, sources))
                    let groupedSourcesByName: Map<string, Source[]> = groupBy(sources, source => source.name);
                    groupedSourcesByName.forEach((sources: Source[], name: string) => {
                        tooltipContent.addRow('', this.getEvidenceXRefLinks({ elem: sources, name: name, alternative: false }));
                        if (name === 'PubMed') {
                            tooltipContent.addRow('', this.getEvidenceXRefLinks({ elem: sources, name: 'EuropePMC', alternative: true }));
                        }
                    });
                });
            }
            tooltipContent.addRow('Tools', this.getBlast(uniprotId, feature));
            typeFeatureAligner.addFragment(new Fragment(parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor, tooltipContent));
        });
        const categoryRenderers: BasicTrackRenderer<FeatureOutput>[] = [];
        for (const [category, categoryData] of categories.entries()) {
            const typeTrackRows: TrackRow<FeatureOutput>[] = [];
            for (const [type, fragmentAligner] of categoryData) {
                typeTrackRows.push(new TrackRow(fragmentAligner.getAccessions(), config[type]?.label ?? type));
            }
            categoryRenderers.push(new BasicTrackRenderer(typeTrackRows, categoriesConfig[category]?.label ? categoriesConfig[category]?.label : this.createLabel(category)));
        }
        this.emitOnDataLoaded.emit([])
        if (categories.size > 0) {
            return new CompositeTrackRenderer(categoryRenderers);
        }
        else {
            return null;
        }
    }
    createLabel(category: string) {
        category = category[0].toUpperCase() + category.slice(1, category.length).replace(/_/g, ' ').toLowerCase();
        return category;
    }

    private getBlast(accession: string, feature: { category: string; type: string; begin: string; end: string; ftId: string | undefined; description: string | undefined; }) {
        const blastURL = 'http://www.uniprot.org/blast/?about=';
        const noBlastTypes = ['helix', 'strand', 'turn', 'disulfid', 'crosslnk', 'variant'];
        const end = parseInt(feature.end);
        const type = feature.type.toLowerCase();
        if (((end - parseInt(feature.begin)) >= 3) && (!noBlastTypes.includes(type))) {
            var url = blastURL + accession + '[' + feature.begin + '-' + end + ']&key=' + (config[feature.type].name ? config[feature.type].label : this.convertTypeToLabel(feature.type));
            if (feature.ftId) {
                url += '&id=' + feature.ftId;
            }
            const blast = '<span><a href="' + url + '" target="_blank">BLAST</a>';
            return blast;
        }
    }

    private convertTypeToLabel(name: string) {
        var label = name.replace(/_/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
        return label;
    }

    private getEvidenceText(accession: string, code: string, sources: Source[]) {
        const eco = ecoMap.filter((record: { name: string; }) => record.name == code)[0] as { name: string, description: string, shortDescription: string, acronym: string, isManual: boolean };
        const acronym = eco.acronym;
        let publications: number = sources.filter((source: { name: string; }) => source.name == 'PubMed' || source.name == 'Citation').length;
        let evidenceText = '';
        if ((acronym === 'EXP') || (acronym === 'NAS')) {
            publications += sources.filter((source) => {
                if (source.id && (source.id.indexOf('ref.') === 0)) {
                    source.name = 'Citation';
                    source.url = 'http://www.uniprot.org/uniprot/' + accession + '#ref' + source.id.slice(4);
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
    private getEvidenceXRefLinks(info: { elem: Source[], name: string, alternative: boolean }) {
        let text = info.name + ' ';
        info.elem.forEach((source, i) => {
            var url = info.alternative === true ? source.alternativeUrl : source.url;
            text += '<span><a href="' + url + '" target="_blank">' + source.id + '</a></span>';
            if (i !== (info.elem.length - 1)) {
                text += '<span>|</span>';
            }
        });
        return text;
    };
}
type Source = { name: string, id: string, url: string, alternativeUrl: string };
const categoriesConfig: Record<string, { label: string }> = {
    "DOMAINS_AND_SITES": {
        "label": "Domains & sites"
    },
    "MOLECULE_PROCESSING": {
        "label": "Molecule processing"
    },
    "PTM": {
        "label": "PTM"
    },
    "SEQUENCE_INFORMATION": {
        "label": "Sequence information"
    },
    "STRUCTURAL": {
        "label": "Structural features"
    },
    "MUTAGENESIS": {
        "label": "Mutagenesis"
    },
    "VARIANTS": {
        "label": "Variants"
    }
}

type FeatureOutput = {};

