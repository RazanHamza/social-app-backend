
import { Router } from "express";
import US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { Validation } from "../../common/middleware/validation.js";
import { updateProfileSchema,searchUsersSchema } from "./user.validation.js";


const userRouter = Router();

userRouter.get(
  "/profile",
  authentication,
  US.getProfile
);

userRouter.patch(
  "/update-profile",
  authentication,
  Validation(updateProfileSchema),
  US.updateProfile,
);

userRouter.post(
  "/:userId/follow",
  authentication,
  US.followUser,
);

userRouter.delete(
  "/:userId/unfollow",
  authentication,
  US.unfollowUser,
);

userRouter.get(
  "/search",
  authentication,
  Validation(searchUsersSchema),
  US.searchUsers,
);

export default userRouter;
