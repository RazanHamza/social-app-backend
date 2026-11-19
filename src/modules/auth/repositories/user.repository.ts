   import { Model, ProjectionType, QueryOptions } from "mongoose";
import {DBRepository} from "./db.repository.js";
import { IUser } from "../../../DB/models/user.model.js";
import userModel from "../../../DB/models/user.model.js";
   
   export class userRepository<T> extends DBRepository<IUser> {
        constructor( public readonly model: Model<IUser>= userModel) {
            super(model)
        }  

        createUser = async (data: Partial<IUser>) => {
    return await this.model.create([data]);
  };
     }