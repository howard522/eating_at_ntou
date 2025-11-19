// server/interfaces/image.interface.ts

export interface IImageFile {
    data: Uint8Array;
    type?: string;
    filename?: string;
}
