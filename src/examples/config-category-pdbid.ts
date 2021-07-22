import { SequenceConfig } from "../types/config";
export const configCategoryPdbIdSetting: SequenceConfig = {
    uniprotId: "P37840",
    //pdbIs which should be shown (others won't)
    pdbIds: ["6cu7", "2m55"],
    //order of first categories, others wil be show after these by default order
    categoryOrder: ["VARIATION", "STRUCTURAL"],
    //categories which shouldn't be shown
    categoryExclusions: ["SEQUENCE_INFORMATION", "TOPOLOGY", "MUTAGENESIS", "MOLECULE_PROCESSING"]
};
