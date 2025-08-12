import pg from "pg"
import 'dotenv/config'

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
})

export const query = (text, params)  => pool.query(text, params)

export const testConnection = async () => {
    try {
        const client = await pool.connect()
        console.log("Database connected successfully")
        client.release()
    } catch (error) {
        console.error("Error connecting to database:", error)
        process.exit(1)
    }
}