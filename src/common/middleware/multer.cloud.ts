import type { Request } from "express"
import multer from "multer"
import { AppError } from "../utils/globalErrorHandling.js";
import { Multer_Enum, Store_Enum } from "../enum/multer.enum.js";
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto";

export const multer_cloud = ({
    customTypes = Multer_Enum.images,
    store_type = Store_Enum.memory
}: {
    customTypes?: readonly string[],
    store_type?: Store_Enum
}) => {

    const storage = store_type === Store_Enum.memory ?
        multer.memoryStorage() :
        multer.diskStorage({
            destination: tmpdir(),
            filename: (req, file, cb) => {
                cb(null, randomUUID() + "_" + file.originalname)
            }
        })

    function fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
        if (customTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new AppError("Invalid file type"))
        }
    }

    const upload = multer({ storage, fileFilter })
    return upload
}