// original PV components
// @ts-ignore
import ProtvistaManager from "protvista-manager";
// @ts-ignore
import ProtvistaSequence from "protvista-sequence";
// @ts-ignore
import ProtvistaFilter from "protvista-filter";
// @ts-ignore
import ProtvistaNavigation from "protvista-navigation";
import LimitedTrack from "./limited-track";
import { ProtvistaWrapper } from "./protvista-wrapper";

import { loadComponent } from "./utils";

import TrackManager from "./track-manager";
import SMRParser from "./SMR-parser";
import PdbParser from "./pdb-parser";
import AntigenParser from "./antigen-parser";
import ProteomicsParser from "./proteomics-parser";
import "./index.html";
import './main.css';


const registerWebComponents = function () {
    loadComponent("protvista-manager", ProtvistaManager);
    loadComponent("protvista-filter", ProtvistaFilter);
    // @ts-ignore
    loadComponent("protvista-sequence", ProtvistaSequence);
    // @ts-ignore
    loadComponent("protvista-track", LimitedTrack);
    loadComponent("protvista-wrapper", ProtvistaWrapper);
    loadComponent("protvista-navigation", ProtvistaNavigation);
}

// Conditional loading of polyfill
if (window.customElements) {
    registerWebComponents();
} else {
    document.addEventListener('WebComponentsReady', function () {
        registerWebComponents();
    });
}

let trackManager: TrackManager = new TrackManager(uniProtId =>`https://www.uniprot.org/uniprot/${uniProtId}.fasta`);
trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniProtId}`, new ProteomicsParser());
trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/antigen/${uniProtId}`, new AntigenParser());
trackManager.addTrack(uniProtId => `https://swissmodel.expasy.org/repository/uniprot/${uniProtId}.json?provider=swissmodel`, new SMRParser());
trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniProtId}`, new PdbParser());

(window as any).TrackManager = trackManager;