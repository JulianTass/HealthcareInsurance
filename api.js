// HCF Healthcare Insurance API - Updated for 4-digit codes with Real-time notifications
// File: server.js

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Store active SSE connections for real-time notifications
const activeConnections = new Set();

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://127.0.0.1:5500','http://192.168.0.8:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for generated codes (in production, use a database)
const generatedCodes = new Map();
const codeExpiry = new Map();

// Utility function to generate 4-digit code
function generateFourDigitCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Utility function to generate secure session ID
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

// Broadcast new code to all connected clients
function broadcastNewCode(codeData) {
    const message = {
        type: 'NEW_CODE',
        data: {
            sessionId: codeData.sessionId,
            code: codeData.code,
            phoneNumber: codeData.phoneNumber,
            generated: new Date(codeData.generated).toISOString(),
            expires: new Date(codeData.expiryTime).toISOString()
        },
        timestamp: new Date().toISOString()
    };

    console.log(`📡 Broadcasting new code to ${activeConnections.size} connected clients:`, codeData.code);

    // Send to all connected clients
    activeConnections.forEach(connection => {
        try {
            connection.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
            console.error('❌ Error broadcasting to client:', error);
            activeConnections.delete(connection);
        }
    });
}

// Server-Sent Events endpoint for real-time code notifications
app.get('/api/notifications/codes', (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Add this connection to our active connections
    activeConnections.add(res);
    
    console.log(`📡 New SSE client connected. Total clients: ${activeConnections.size}`);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'CONNECTED',
        message: 'Connected to HCF code notifications',
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
        activeConnections.delete(res);
        console.log(`📡 SSE client disconnected. Total clients: ${activeConnections.size}`);
    });

    // Keep connection alive with periodic pings
    const keepAlive = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({
                type: 'PING',
                timestamp: new Date().toISOString()
            })}\n\n`);
        } catch (error) {
            clearInterval(keepAlive);
            activeConnections.delete(res);
        }
    }, 30000); // Send ping every 30 seconds

    req.on('close', () => {
        clearInterval(keepAlive);
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'HCF Healthcare Insurance API',
        version: '2.1.0',
        codeLength: '4 digits',
        realTime: 'Server-Sent Events enabled',
        endpoints: {
            health: 'GET /api/health',
            generateCode: 'POST /api/auth/generate-code',
            verifyCode: 'POST /api/auth/verify-code',
            adminSessions: 'GET /api/admin/sessions',
            notifications: 'GET /api/notifications/codes (SSE)'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'HCF API is running perfectly!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        codeType: '4-digit authentication codes',
        activeConnections: activeConnections.size
    });
});

// Generate 4-digit authentication code
app.post('/api/auth/generate-code', (req, res) => {
    try {
        const { phoneNumber, deviceId, existingSessionId } = req.body;
        
        // Validate input
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }
        
        // If existing session ID provided, try to return that session's code
        if (existingSessionId && generatedCodes.has(existingSessionId)) {
            const existingData = generatedCodes.get(existingSessionId);
            const expiry = codeExpiry.get(existingSessionId);
            
            if (Date.now() < expiry && !existingData.used) {
                console.log(`📱 Returning existing code for session: ${existingSessionId}`);
                return res.json({
                    success: true,
                    sessionId: existingSessionId,
                    message: 'Existing authentication code retrieved',
                    expiryTime: expiry,
                    code: existingData.code,
                    note: 'Returned existing active session code'
                });
            }
        }
        
        // Generate new session ID and 4-digit code
        const sessionId = generateSessionId();
        const code = generateFourDigitCode();
        const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes expiry
        
        // Store the code with expiry
        const codeData = {
            code: code,
            phoneNumber: phoneNumber,
            deviceId: deviceId || 'unknown',
            generated: Date.now(),
            used: false,
            sessionId: sessionId,
            expiryTime: expiryTime
        };
        
        generatedCodes.set(sessionId, codeData);
        codeExpiry.set(sessionId, expiryTime);
        
        // 🚀 BROADCAST NEW CODE TO ALL CONNECTED CLIENTS
        broadcastNewCode(codeData);
        
        // In production, you would send SMS here
        console.log(`📱 SMS Code for ${phoneNumber}: ${code} (Session: ${sessionId})`);
        
        res.json({
            success: true,
            sessionId: sessionId,
            message: 'Authentication code generated successfully',
            expiryTime: expiryTime,
            // For demo purposes, we return the code. In production, remove this!
            code: code,
            note: 'In production, this 4-digit code would be sent via SMS'
        });
        
    } catch (error) {
        console.error('Error generating code:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Verify 4-digit authentication code
app.post('/api/auth/verify-code', (req, res) => {
    try {
        const { sessionId, code } = req.body;
        
        // Validate input
        if (!sessionId || !code) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and code are required'
            });
        }
        
        // Check if session exists
        const sessionData = generatedCodes.get(sessionId);
        if (!sessionData) {
            return res.status(404).json({
                success: false,
                error: 'Invalid session ID'
            });
        }
        
        // Check if code has expired
        const expiry = codeExpiry.get(sessionId);
        if (Date.now() > expiry) {
            generatedCodes.delete(sessionId);
            codeExpiry.delete(sessionId);
            return res.status(410).json({
                success: false,
                error: 'Code has expired'
            });
        }
        
        // Check if code has already been used
        if (sessionData.used) {
            return res.status(409).json({
                success: false,
                error: 'Code has already been used'
            });
        }
        
        // Verify the 4-digit code
        if (sessionData.code === code) {
            // Mark code as used
            sessionData.used = true;
            generatedCodes.set(sessionId, sessionData);
            
            // Generate authentication token (simplified for demo)
            const authToken = crypto.randomBytes(32).toString('hex');
            
            res.json({
                success: true,
                message: 'Code verified successfully',
                authToken: authToken,
                user: {
                    phoneNumber: sessionData.phoneNumber,
                    deviceId: sessionData.deviceId,
                    verifiedAt: new Date().toISOString()
                }
            });
            
            // Clean up after successful verification
            setTimeout(() => {
                generatedCodes.delete(sessionId);
                codeExpiry.delete(sessionId);
            }, 60000); // Clean up after 1 minute
            
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid code'
            });
        }
        
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get all active sessions (for admin/debugging)
app.get('/api/admin/sessions', (req, res) => {
    const activeSessions = [];
    
    for (const [sessionId, data] of generatedCodes.entries()) {
        const expiry = codeExpiry.get(sessionId);
        if (Date.now() < expiry) {
            activeSessions.push({
                sessionId: sessionId,
                phoneNumber: data.phoneNumber,
                generated: new Date(data.generated).toISOString(),
                expires: new Date(expiry).toISOString(),
                used: data.used,
                code: data.code,  // 4-digit code
                codeLength: data.code.length
            });
        }
    }
    
    res.json({
        success: true,
        activeSessions: activeSessions,
        count: activeSessions.length,
        codeFormat: '4-digit numeric codes',
        connectedClients: activeConnections.size
    });
});

// Generate test codes endpoint (for development/testing)
app.post('/api/admin/generate-test-codes', (req, res) => {
    const { count = 5 } = req.body;
    const testCodes = [];
    
    for (let i = 0; i < count; i++) {
        const sessionId = generateSessionId();
        const code = generateFourDigitCode();
        const expiryTime = Date.now() + (5 * 60 * 1000);
        
        const codeData = {
            code: code,
            phoneNumber: '+61 400 000 000',
            deviceId: 'test-device',
            generated: Date.now(),
            used: false,
            sessionId: sessionId,
            expiryTime: expiryTime
        };
        
        generatedCodes.set(sessionId, codeData);
        codeExpiry.set(sessionId, expiryTime);
        
        // Broadcast each test code
        broadcastNewCode(codeData);
        
        testCodes.push({
            sessionId: sessionId,
            code: code,
            expires: new Date(expiryTime).toISOString()
        });
    }
    
    res.json({
        success: true,
        message: `Generated ${count} test codes`,
        testCodes: testCodes
    });
});

// Cleanup expired codes every minute
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, expiry] of codeExpiry.entries()) {
        if (now > expiry) {
            generatedCodes.delete(sessionId);
            codeExpiry.delete(sessionId);
            console.log(`🗑️  Cleaned up expired session: ${sessionId}`);
        }
    }
}, 60000);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 HCF API Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Generate 4-digit code: POST http://localhost:${PORT}/api/auth/generate-code`);
    console.log(`✅ Verify 4-digit code: POST http://localhost:${PORT}/api/auth/verify-code`);
    console.log(`📋 Admin sessions: GET http://localhost:${PORT}/api/admin/sessions`);
    console.log(`🧪 Generate test codes: POST http://localhost:${PORT}/api/admin/generate-test-codes`);
    console.log(`📡 Real-time notifications: GET http://localhost:${PORT}/api/notifications/codes`);
    console.log(`📋 Root endpoint: GET http://localhost:${PORT}/`);
    console.log(`🎯 Now generating 4-digit authentication codes with real-time push!`);
});

module.exports = app;