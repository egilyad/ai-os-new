export type PersonaType = 'historical' | 'fictional' | 'contemporary' | 'archetypal';

export type PersonaEra =
    | 'ancient'
    | 'classical'
    | 'medieval'
    | 'renaissance'
    | 'enlightenment'
    | 'modern'
    | 'contemporary'
    | 'fictional';

export interface PersonaEntry {
    id: string;
    name: string;
    personaType: PersonaType;
    era: PersonaEra;
    nationality: string;
    field: string;
    description: string;
    systemPrompt: string;
    temperature: number;
    icon: string;
    color: string;
    birthYear?: number;
    deathYear?: number;
    famousWorks?: string[];
    quotes?: string[];
    biography?: string;
    speakingStyle?: string;
    tags: string[];
    category: PersonaCategory;
}

export type PersonaCategory =
    | 'scientist'
    | 'philosopher'
    | 'writer'
    | 'politician'
    | 'artist'
    | 'musician'
    | 'entrepreneur'
    | 'military'
    | 'religious'
    | 'fictional'
    | 'expert';

export const PERSONA_CATEGORIES: PersonaCategory[] = [
    'scientist',
    'philosopher',
    'writer',
    'politician',
    'artist',
    'musician',
    'entrepreneur',
    'military',
    'religious',
    'fictional',
    'expert',
];
