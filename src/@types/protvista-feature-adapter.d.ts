declare module 'protvista-feature-adapter/src/evidences' {
    export = ecoMap;
    const ecoMap: {
        name: string;
        description: string;
        shortDescription: string;
        acronym: string;
        isManual?: boolean;
    }[]
}