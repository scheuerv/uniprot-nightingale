export type FoundInterval = {
    readonly id: number;
    readonly direct: boolean;
    readonly outOfRange: boolean;
};

export type Interval = {
    readonly start: number;
    readonly end: number;
};
