import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum.js";

export const updateProfileSchema = {
  body: z.strictObject({
    fName: z.string().min(3).max(20).trim().optional(),
    lName: z.string().min(3).max(20).trim().optional(),
    gender: z.enum(GenderEnum).optional(),
    phone: z.string().optional(),
    profileImage: z.string().url().optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required",
    },
  ),
};


export const searchUsersSchema = {
  query: z.strictObject({
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(20).default(10),
  }),
};
