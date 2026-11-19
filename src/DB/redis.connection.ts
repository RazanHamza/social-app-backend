import { createClient, type RedisClientType } from "redis";

export class RedisService {
  private readonly redis_Client: RedisClientType;

  constructor() {
    this.redis_Client = createClient({
      url: "rediss://default:gQAAAAAAAYgAAAIgcDIwNzY2MjkzMDFkMTA0ZDk2YTU4OTAyNGI5NjRkYmE0MQ@unique-pegasus-100352.upstash.io:6379",
    });
    this.handelEvents();
  }

  handelEvents = () => {
    this.redis_Client.on("connect", () => {
      console.log("Redis client connected");
    });
  };

  connect = async () => {
    await this.redis_Client.connect();
    console.log("...... Redis connected Successfully .....");
  };
  setValue = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: unknown;
    ttl?: number;
  }) => {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);

      if (data === undefined) {
        throw new Error("Invalid Redis value");
      }

      return ttl !== undefined
        ? await this.redis_Client.set(key, data, { EX: ttl })
        : await this.redis_Client.set(key, data);
    } catch (error) {
      console.log(error, "\nRedis setValue failed");
      throw error;
    }
  };

  update = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: unknown;
    ttl?: number;
  }) => {
    try {
      if (!(await this.redis_Client.exists(key))) return 0;

      const data = typeof value === "string" ? value : JSON.stringify(value);

      if (data === undefined) {
        throw new Error("Invalid Redis value");
      }

      return ttl !== undefined
        ? await this.redis_Client.set(key, data, { EX: ttl })
        : await this.redis_Client.set(key, data);
    } catch (error) {
      console.log(error, "\nRedis update failed");
      throw error;
    }
  };

  getValue = async (key: string) => {
    try {
      const data = await this.redis_Client.get(key);

      if (data === null) return null;

      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      console.log(error, "\nRedis get failed");
      throw error;
    }
  };

  ttl = async (key: string) => {
    try {
      return await this.redis_Client.ttl(key);
    } catch (error) {
      console.log(error, "\nRedis ttl failed");
      throw error;
    }
  };

  exists = async (key: string) => {
    try {
      return await this.redis_Client.exists(key);
    } catch (error) {
      console.log(error, "\nRedis exists failed");
      throw error;
    }
  };

  expire = async ({ key, ttl }: { key: string; ttl: number }) => {
    try {
      return await this.redis_Client.expire(key, ttl);
    } catch (error) {
      console.log(error, "\nRedis expire failed");
      throw error;
    }
  };

  deleteKey = async (key: string) => {
    try {
      if (!key?.length) return 0;

      return await this.redis_Client.del(key);
    } catch (error) {
      console.log(error, "\nRedis deleteKey failed");
      throw error;
    }
  };

  keys = async (key: string) => {
    try {
      return await this.redis_Client.keys(`${key}*`);
    } catch (error) {
      console.log(error, "\nRedis keys failed");
      throw error;
    }
  };

  incr = async (key: string) => {
    try {
      return await this.redis_Client.incr(key);
    } catch (error) {
      console.log(error, "\nRedis incr failed");
      throw error;
    }
  };
}

export default new RedisService();
