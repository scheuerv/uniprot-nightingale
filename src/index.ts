// original PV components
import ProtvistaManager from "protvista-manager";
import ProtvistaSequence from "protvista-sequence";

import VariationFilter from "./variation-filter";
import ProtvistaNavigation from "protvista-navigation";
import ProtvistaTooltip from "protvista-tooltip";
import LimitedTrack from "./protvista/limited-track";

import { loadComponent } from "./utils";

import TrackManager from "./manager/track-manager";
import SMRParser from "./parsers/SMR-parser";
import PdbParser from "./parsers/pdb-parser";
import AntigenParser from "./parsers/antigen-parser";
import ProteomicsParser from "./parsers/proteomics-parser";
import VariationParser from "./parsers/variation-parser";
import "./index.html";
import './main.css';
import FeatureParser from "./parsers/feature-parser";
import VariationGraph from "./variation-graph";
import ProtvistaVariation from "protvista-variation";


const registerWebComponents = function () {
    loadComponent("protvista-manager", ProtvistaManager);
    loadComponent("protvista-filter", VariationFilter);
    loadComponent("protvista-sequence", ProtvistaSequence);
    loadComponent("protvista-track", LimitedTrack);
    loadComponent("protvista-navigation", ProtvistaNavigation);
    loadComponent("protvista-tooltip", ProtvistaTooltip);
    loadComponent("protvista-variation-graph", VariationGraph);
    loadComponent("protvista-variation", ProtvistaVariation);
}

// Conditional loading of polyfill
if (window.customElements) {
    registerWebComponents();
} else {
    document.addEventListener('WebComponentsReady', function () {
        registerWebComponents();
    });
}

const trackManager: TrackManager = new TrackManager(uniProtId => `https://www.uniprot.org/uniprot/${uniProtId}.fasta`);

trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/variation/${uniProtId}`, new VariationParser());
trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/features/${uniProtId}`, new FeatureParser());
trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniProtId}`, new ProteomicsParser());
trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/antigen/${uniProtId}`, new AntigenParser());
trackManager.addTrack(uniProtId => `https://swissmodel.expasy.org/repository/uniprot/${uniProtId}.json?provider=swissmodel`, new SMRParser());
trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniProtId}`, new PdbParser());

(window as any).TrackManager = trackManager;