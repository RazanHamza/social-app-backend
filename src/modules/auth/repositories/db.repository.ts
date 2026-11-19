import {
  Model,
  ProjectionType,
  QueryOptions,
  QueryFilter,
  PopulateOptions,
} from "mongoose";
import { UpdateQuery } from "mongoose";

export  abstract class DBRepository<T> {
  constructor(public readonly model: Model<T>) {}

  create = async (data: Partial<T>) => {
    return await this.model.create([data]);
  };

  findOne = async ({
    filter,
    options = {},
    projection,
  }: {
    filter: QueryFilter<T>;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
  }) => {
    return await this.model.findOne(filter, projection, options);
  };

  find = async ({
    filter,
    options = {},
  }: {
    filter: QueryFilter<T>;
    options: QueryOptions<T>;
  }) => {
    let query = this.model.find(filter);
    if (options?.select) query = query.select(options?.select);
    if (options?.limit) query = query.limit(options?.limit);
    if (options?.skip) query = query.skip(options?.skip);
    if (options?.populate) {
      const populateOptions = Array.isArray(options.populate)
        ? options.populate.map((item) =>
            typeof item === "string" ? { path: item } : item,
          )
        : typeof options.populate === "string"
          ? { path: options.populate }
          : options.populate;

      query = query.populate(populateOptions);
    }
    return await query.exec();
  };

  findById = async ({
    id,
    options = {},
  }: {
    id: string;
    options: QueryOptions<T>;
  }) => {
    return await this.model.findById(id, options);
  };

  findByIdAndUpdate = async ({
    id,
    data,
    options = {},
  }: {
    id: string;
    data: Partial<T>;
    options: QueryOptions<T>;
  }) => {
    return await this.model.findByIdAndUpdate(id, data, options);
  };

  findOneAndUpdate = async ({
    filter,
    data,
    options = {},
  }: {
    filter: QueryFilter<T>;
    data: Partial<T>;
    options: QueryOptions<T>;
  }) => {
    return await this.model.findOneAndUpdate(filter, data, options);
  };

  deleteMany = async ({
    filter,
    options = {},
  }: {
    filter: QueryFilter<T>;
    options: QueryOptions<T>;
  }) => {
    return await this.model.deleteMany(filter).setOptions(options).exec();
  };

  updateOne = async ({
  filter,
  data,
}: {
  filter: QueryFilter<T>;
  data: UpdateQuery<T>;
}) => {
  return await this.model.updateOne(filter, data);
};
}
