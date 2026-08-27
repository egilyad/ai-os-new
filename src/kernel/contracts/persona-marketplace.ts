export type PersonaCategory =
    'professional' | 'creative' | 'technical' | 'academic' | 'entertainment' | 'custom';

export interface PersonaListing {
    id: string;
    name: string;
    description: string;
    category: PersonaCategory;
    author: string;
    version: string;
    rating: number;
    downloads: number;
    price: number;
    tags: string[];
    promptPreview: string;
    installed: boolean;
    createdAt: number;
}

export interface IPersonaMarketplaceService {
    getListings(category?: PersonaCategory): PersonaListing[];
    search(query: string): PersonaListing[];
    install(id: string): void;
    uninstall(id: string): void;
    rate(id: string, rating: number): void;
    getInstalled(): PersonaListing[];
    addListing(
        listing: Omit<PersonaListing, 'id' | 'createdAt' | 'installed' | 'downloads' | 'rating'>,
    ): PersonaListing;
    updateListing(id: string, updates: Partial<PersonaListing>): void;
    removeListing(id: string): void;
}
