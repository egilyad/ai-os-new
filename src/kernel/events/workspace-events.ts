export interface WorkspaceAttachedPayload {
    name: string;
    fileCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WorkspaceDetachedPayload {}

export interface WorkspaceFileReadPayload {
    path: string;
}
