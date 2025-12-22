export interface ApiAd {
    _id: string;
    title: string;
    imageUrl?: string;
    linkUrl?: string;
    text: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
