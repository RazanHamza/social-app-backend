import mongoose from "mongoose"
import { DB_URL} from "../config/config.service.js";

const ConnectionDB = async () => {
    await mongoose.connect(DB_URL)
    .then(() => {
        console.log("...... DB connected successfully .....");
    })
    .catch((err: any) => {
        console.log("...... DB connected failed ......");
    })
}

export default ConnectionDB