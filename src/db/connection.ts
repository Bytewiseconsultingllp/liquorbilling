import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not defined")
}

/* ---------- global cache so HMR / serverless cold-starts reuse the conn ---------- */
interface MongoCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: MongoCache | undefined
}

const cached: MongoCache = global._mongoCache ?? { conn: null, promise: null }
if (!global._mongoCache) global._mongoCache = cached

/* ---------- connect (or return existing connection) ---------- */
export async function connectDB() {
  // Already connected & socket is live → fast-path
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // No in-flight promise → create one
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,          // fail fast instead of buffering for 10 s
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((m) => {
        cached.conn = m
        return m
      })
      .catch((err) => {
        // Clear the cached promise so the NEXT call retries instead of
        // awaiting the same rejected promise forever.
        cached.promise = null
        cached.conn = null
        throw err
      })
  }

  // Await the in-flight (or just-created) promise
  try {
    cached.conn = await cached.promise
  } catch {
    // Already cleared inside the .catch above, just re-throw
    cached.promise = null
    cached.conn = null
    throw new Error("MongoDB connection failed – please retry")
  }

  return cached.conn
}
