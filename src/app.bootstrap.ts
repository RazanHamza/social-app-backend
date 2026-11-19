import { PORT } from "./config/config.service.js";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import {
  AppError,
  GlobalErrorHandling,
} from "./common/utils/globalErrorHandling.js";
import authRouter from "./modules/auth/auth.controller.js";
import ConnectionDB from "./DB/connectionDB.js";
import RedisService from "./DB/redis.connection.js";
import userRouter from "./modules/users/user.controller.js";
import { authentication } from "./common/middleware/authentication.js";
import { authorization } from "./common/middleware/authorization.js";
import { RoleEnum } from "./common/enum/user.enum.js";

const app = express();
const port = PORT;

const bootstrap = async () => {
  app.use(cors());
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );
  app.use(express.json());

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json("Hello in my app!");
  });

  // app.get("/protected", authentication, (req: Request, res: Response) => {
  //   return res.status(200).json({
  //     message: "Authentication successful",
  //     user: req.user,
  //   });
  // });

  //   app.get(
  //   "/admin-only",
  //   authentication,
  //   authorization(RoleEnum.admin),
  //   (req: Request, res: Response) => {
  //     return res.status(200).json({
  //       message: "Welcome Admin",
  //     });
  //   },
  // );

  await ConnectionDB();
  await RedisService.connect();

  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(
      `Url: ${req.originalUrl} with method ${req.method} not found`,
      404,
    );
  });

  app.use(GlobalErrorHandling);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};
export default bootstrap;
