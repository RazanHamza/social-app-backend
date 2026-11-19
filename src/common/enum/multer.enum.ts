export const Multer_Enum = {
    images: ["image/jpeg", "image/jpg", "image/png"],
    videos: ["video/mp4", "video/mpeg"],
    pdf: ["application/pdf"],
    files: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf"
    ]
} as const;

export enum Store_Enum {
    memory = "memory",
    disk = "disk"
}