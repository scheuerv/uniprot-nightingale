import { FragmentMapping } from "../types/mapping";

export function findUniprotIntervalsFromStructureResidues(
    start: number,
    end: number,
    mappings: FragmentMapping[]
): Interval[] {
    const startInterval = findIntervalIdByResNumber(start, mappings);
    if (startInterval.outOfRange) {
        return [];
    }
    const endInterval = findIntervalIdByResNumber(end, mappings);
    if (startInterval.id == endInterval.id && !startInterval.direct && !endInterval.direct) {
        return [];
    }

    const startId = startInterval.id;
    let startUniprot;
    if (startInterval.direct) {
        startUniprot =
            start -
            mappings[startInterval.id].start.residue_number +
            mappings[startInterval.id].unp_start;
    } else {
        startUniprot = mappings[startInterval.id].unp_start;
    }

    let endId;
    let endUniprot;
    if (endInterval.direct) {
        endId = endInterval.id;
        endUniprot =
            end -
            mappings[endInterval.id].start.residue_number +
            mappings[endInterval.id].unp_start;
    } else {
        endId = endInterval.id - 1;
        endUniprot = mappings[endInterval.id - 1].unp_end;
    }
    let lastStart = startUniprot;
    const intervals: Interval[] = [];
    for (let id = startId + 1; id <= endId; ++id) {
        intervals.push({
            start: lastStart,
            end: mappings[id - 1].unp_end
        });
        lastStart = mappings[id].unp_start;
    }
    intervals.push({
        start: lastStart,
        end: endUniprot
    });
    return intervals;
}

export function findUniprotIntervalsFromUniprotSequence(
    start: number,
    end: number,
    mappings: FragmentMapping[]
): Interval[] {
    const startInterval = findIntervalIdByUniprotNumber(start, mappings);
    if (startInterval.outOfRange) {
        return [];
    }
    const endInterval = findIntervalIdByUniprotNumber(end, mappings);
    if (startInterval.id == endInterval.id && !startInterval.direct && !endInterval.direct) {
        return [];
    }

    const startId = startInterval.id;
    let startUniprot;
    if (startInterval.direct) {
        startUniprot = start;
    } else {
        startUniprot = mappings[startInterval.id].unp_start;
    }

    let endId;
    let endUniprot;
    if (endInterval.direct) {
        endId = endInterval.id;
        endUniprot = end;
    } else {
        endId = endInterval.id - 1;
        endUniprot = mappings[endInterval.id - 1].unp_end;
    }
    let lastStart = startUniprot;
    const intervals: Interval[] = [];
    for (let id = startId + 1; id <= endId; ++id) {
        intervals.push({
            start: lastStart,
            end: mappings[id - 1].unp_end
        });
        lastStart = mappings[id].unp_start;
    }
    intervals.push({
        start: lastStart,
        end: endUniprot
    });
    return intervals;
}

function findIntervalIdByResNumber(resNumber: number, mappings: FragmentMapping[]): FoundInterval {
    for (let i = 0; i < mappings.length; ++i) {
        const mapping = mappings[i];
        if (
            (mapping.start.residue_number <= resNumber &&
                resNumber <= mapping.end.residue_number) ||
            mapping.start.residue_number > resNumber
        ) {
            return {
                id: i,
                direct: mapping.start.residue_number <= resNumber,
                outOfRange: false
            };
        }
    }
    return {
        id: mappings.length,
        direct: false,
        outOfRange: true
    };
}

function findIntervalIdByUniprotNumber(
    unpNumber: number,
    mappings: FragmentMapping[]
): FoundInterval {
    for (let i = 0; i < mappings.length; ++i) {
        const mapping = mappings[i];
        if (
            (mapping.unp_start <= unpNumber && unpNumber <= mapping.unp_end) ||
            mapping.unp_start > unpNumber
        ) {
            return {
                id: i,
                direct: mapping.unp_start <= unpNumber,
                outOfRange: false
            };
        }
    }
    return {
        id: mappings.length,
        direct: false,
        outOfRange: true
    };
}
type FoundInterval = {
    readonly id: number;
    readonly direct: boolean;
    readonly outOfRange: boolean;
};

type Interval = {
    readonly start: number;
    readonly end: number;
};
