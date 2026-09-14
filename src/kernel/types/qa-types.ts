/**
 * Browser inspector types (roadmapp.md §P5).
 */

export interface LinkCheck {
    url: string;
    text: string;
    valid: boolean;
    status?: number;
    error?: string;
}

export interface VisualCheck {
    hasHeadings: boolean;
    headingCount: number;
    hasImages: number;
    hasForms: boolean;
    hasNavigation: boolean;
    hasFooter: boolean;
    hasViewport: boolean;
    hasCharset: boolean;
}

export interface TextCheck {
    wordCount: number;
    hasTitle: boolean;
    hasMetaDescription: boolean;
    hasAltTexts: boolean;
    missingAltCount: number;
    emptyLinks: number;
    emptyButtons: number;
}

export interface FunctionalityCheck {
    hasScripts: boolean;
    hasEventListeners: boolean;
    hasForms: boolean;
    hasInternalLinks: boolean;
    brokenAnchors: string[];
}

export interface QAReport {
    projectId: string;
    url?: string;
    timestamp: number;
    links: LinkCheck[];
    visual: VisualCheck;
    text: TextCheck;
    functionality: FunctionalityCheck;
    score: number; // 0-100
    issues: string[];
    passed: boolean;
}
