const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initial inventory
let dispensers = [
    {
        id: 1,
        location: 'College Hostel',
        light: 25,
        regular: 40,
        heavy: 18,
        disposal: 'Working'
    },
    {
        id: 2,
        location: 'College Library',
        light: 6,
        regular: 8,
        heavy: 4,
        disposal: 'Working'
    },
    {
        id: 3,
        location: 'Bus Stand',
        light: 0,
        regular: 12,
        heavy: 7,
        disposal: 'Maintenance'
    }
];

let history = [];

const validPadTypes = ['light', 'regular', 'heavy'];

// Find dispenser
function findDispenser(id) {
    return dispensers.find(
        item => Number(item.id) === Number(id)
    );
}

// Home route
app.get('/', (req, res) => {
    res.send('SmartPad Backend is running successfully!');
});

// Backend status
app.get(['/api/status', '/status'], (req, res) => {
    res.json({
        success: true,
        message: 'SmartPad backend is working!'
    });
});

// Get inventory
app.get(['/api/dispensers', '/dispensers'], (req, res) => {
    res.json({
        success: true,
        dispensers
    });
});

// Dispense one pad
app.post(['/api/dispense', '/dispense'], (req, res) => {
    const { dispenserId, padType, otp } = req.body;

    if (String(otp) !== '4721') {
        return res.status(400).json({
            success: false,
            message: 'Invalid demo OTP. Enter 4721.'
        });
    }

    const dispenser = findDispenser(dispenserId);

    if (!dispenser) {
        return res.status(404).json({
            success: false,
            message: 'Dispenser not found.'
        });
    }

    if (!validPadTypes.includes(padType)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid pad type.'
        });
    }

    if (Number(dispenser[padType]) <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Out of stock.'
        });
    }

    // Decrease stock by exactly one
    dispenser[padType] = Number(dispenser[padType]) - 1;

    const record = {
        id: Date.now(),
        dispenserId: dispenser.id,
        location: dispenser.location,
        padType,
        pad: padType,
        time: new Date().toLocaleString(),
        timestamp: new Date().toISOString(),
        status: 'Successful'
    };

    history.unshift(record);

    return res.json({
        success: true,
        message: 'Pad dispensed successfully. Remaining stock: ' +
            dispenser[padType],
        dispenser,
        dispensers,
        record,
        history
    });
});

// Restock inventory
app.post(['/api/restock', '/restock'], (req, res) => {
    const { dispenserId, padType, quantity } = req.body;

    const dispenser = findDispenser(dispenserId);

    if (!dispenser) {
        return res.status(404).json({
            success: false,
            message: 'Dispenser not found.'
        });
    }

    if (!validPadTypes.includes(padType)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid pad type.'
        });
    }

    const amount = Number(quantity);

    if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantity must be a positive whole number.'
        });
    }

    dispenser[padType] = Number(dispenser[padType]) + amount;

    return res.json({
        success: true,
        message: amount + ' pads added successfully.',
        dispenser,
        dispensers
    });
});

// Update disposal status
app.put(['/api/disposal/:id', '/disposal/:id'], (req, res) => {
    const dispenser = findDispenser(req.params.id);

    if (!dispenser) {
        return res.status(404).json({
            success: false,
            message: 'Dispenser not found.'
        });
    }

    const newStatus = req.body.disposal || req.body.status;

    if (!['Working', 'Maintenance'].includes(newStatus)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid disposal status.'
        });
    }

    dispenser.disposal = newStatus;

    return res.json({
        success: true,
        message: 'Disposal status updated.',
        dispenser,
        dispensers
    });
});

// Activity records
app.get(['/api/history', '/history'], (req, res) => {
    res.json({
        success: true,
        history
    });
});

// Unknown API route
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found: ' +
            req.method + ' ' + req.originalUrl
    });
});

// Start backend
app.listen(PORT, () => {
    console.log(
        'SmartPad backend running at http://localhost:' + PORT
    );
});

