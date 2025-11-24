import { Client } from 'pg';
import { Buffer } from 'buffer';

// --- DATABASE AUTO-INITIALIZATION ---
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    callsign VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_profiles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const getDbClient = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Neon
    });
    await client.connect();
    return client;
};

// --- HANDLERS ---

const handleRegister = async (client: Client, body: any) => {
    const { username, callsign, password } = body;
    
    // Check if taken
    const check = await client.query(
        'SELECT username, callsign FROM users WHERE username = $1 OR callsign = $2',
        [username, callsign]
    );

    if (check.rows.length > 0) {
        const existing = check.rows[0];
        if (existing.username === username) return { statusCode: 409, body: JSON.stringify({ success: false, message: "Username already taken" }) };
        if (existing.callsign === callsign) return { statusCode: 409, body: JSON.stringify({ success: false, message: "Callsign already taken" }) };
    }

    // Insert (In production, hash passwords with bcrypt. For this demo, we store as is to avoid dependency hell in simple prompt)
    const result = await client.query(
        'INSERT INTO users (username, callsign, password_hash) VALUES ($1, $2, $3) RETURNING id, username, callsign',
        [username, callsign, password] // TODO: hash this
    );
    
    const user = result.rows[0];
    const token = Buffer.from(`${user.id}:${user.username}`).toString('base64'); // Simple token for demo

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            token,
            player: { 
                id: user.id, 
                name: user.callsign, 
                username: user.username,
                // Default empty stats will be merged on frontend
            }
        })
    };
};

const handleLogin = async (client: Client, body: any) => {
    const { username, password } = body;
    
    const result = await client.query(
        'SELECT * FROM users WHERE username = $1', 
        [username]
    );

    if (result.rows.length === 0) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: "User not found" }) };
    }

    const user = result.rows[0];
    // In production: await bcrypt.compare(password, user.password_hash)
    if (user.password_hash !== password) {
         return { statusCode: 401, body: JSON.stringify({ success: false, message: "Invalid credentials" }) };
    }

    // Fetch profile data
    const profileRes = await client.query('SELECT data FROM player_profiles WHERE user_id = $1', [user.id]);
    const profileData = profileRes.rows[0]?.data || {};

    const token = Buffer.from(`${user.id}:${user.username}`).toString('base64');

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            token,
            player: {
                ...profileData,
                id: user.id,
                name: user.callsign,
                username: user.username
            }
        })
    };
};

const handleSync = async (client: Client, body: any, userId: string) => {
    const { playerData } = body;
    // Update player profile json
    await client.query(
        `INSERT INTO player_profiles (user_id, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET data = $2, updated_at = NOW()`,
        [userId, playerData]
    );

    // Also update callsign in users table if changed
    if (playerData.name) {
         await client.query('UPDATE users SET callsign = $1 WHERE id = $2', [playerData.name, userId]);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
};

export const handler = async (event: any) => {
    const client = await getDbClient();
    
    try {
        // --- AUTO MIGRATION CHECK ---
        // This runs on every request to ensure DB is ready without manual SQL
        await client.query(INIT_SQL);

        const path = event.path.replace('/.netlify/functions/api', '');
        const method = event.httpMethod;
        const body = event.body ? JSON.parse(event.body) : {};

        // Helper to extract user ID from token
        const getTokenId = () => {
            const authHeader = event.headers.authorization || '';
            if (!authHeader.startsWith('Bearer ')) return null;
            const token = authHeader.split(' ')[1];
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            return decoded.split(':')[0];
        };

        if (method === 'POST' && path === '/register') {
            return await handleRegister(client, body);
        }
        
        if (method === 'POST' && path === '/login') {
            return await handleLogin(client, body);
        }

        if (method === 'POST' && path === '/sync') {
            const userId = getTokenId();
            if (!userId) return { statusCode: 401, body: JSON.stringify({ success: false, message: "Unauthorized" }) };
            return await handleSync(client, body, userId);
        }
        
        if (method === 'GET' && path === '/profile') {
             const userId = getTokenId();
             if (!userId) return { statusCode: 401, body: JSON.stringify({ success: false }) };
             
             // Get user basic info
             const userRes = await client.query('SELECT username, callsign FROM users WHERE id = $1', [userId]);
             if (userRes.rows.length === 0) return { statusCode: 404, body: JSON.stringify({ success: false }) };
             
             const profileRes = await client.query('SELECT data FROM player_profiles WHERE user_id = $1', [userId]);
             const data = profileRes.rows[0]?.data || {};
             
             return {
                 statusCode: 200,
                 body: JSON.stringify({
                     success: true,
                     player: {
                         ...data,
                         id: userId,
                         username: userRes.rows[0].username,
                         name: userRes.rows[0].callsign
                     }
                 })
             };
        }

        return { statusCode: 404, body: "Not Found" };

    } catch (err: any) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    } finally {
        await client.end();
    }
};