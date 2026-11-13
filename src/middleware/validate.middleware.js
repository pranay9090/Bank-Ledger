const { z } = require('zod');

/**
 * Higher-order middleware that validates request data against a Zod schema.
 * Rejects malformed bodies and strips NoSQL operator injections.
 * @param {z.ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            const issues = result.error.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message
            }));
            return res.status(400).json({
                status: "failed",
                message: issues[0]?.message || "Validation error",
                errors: issues
            });
        }
        // Replace request source with sanitized, typed data
        req[source] = result.data;
        next();
    };
}

// Validation schemas
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const registerSchema = z.object({
    name: z.string({ required_error: "Name is required" })
        .trim()
        .min(1, "Name cannot be empty")
        .max(100, "Name is too long"),
    email: z.string({ required_error: "Email is required" })
        .trim()
        .email("A valid email address is required")
        .toLowerCase(),
    password: z.string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters long")
        .max(128, "Password is too long")
});

const loginSchema = z.object({
    email: z.string({ required_error: "Email is required" })
        .trim()
        .email("A valid email address is required")
        .toLowerCase(),
    password: z.string({ required_error: "Password is required" })
        .min(1, "Password cannot be empty")
});

const transferSchema = z.object({
    fromAccount: z.string({ required_error: "fromAccount is required" })
        .regex(objectIdRegex, "Invalid fromAccount ID format"),
    toAccount: z.string({ required_error: "toAccount is required" })
        .regex(objectIdRegex, "Invalid toAccount ID format"),
    amount: z.coerce.number({ required_error: "Amount is required" })
        .positive("Amount must be a positive number greater than 0")
        .finite("Amount must be a valid finite number"),
    idempotencyKey: z.string({ required_error: "idempotencyKey is required" })
        .trim()
        .min(1, "idempotencyKey cannot be empty")
        .max(128, "idempotencyKey is too long")
});

const initialFundsSchema = z.object({
    toAccount: z.string({ required_error: "toAccount is required" })
        .regex(objectIdRegex, "Invalid toAccount ID format"),
    amount: z.coerce.number({ required_error: "Amount is required" })
        .positive("Amount must be a positive number greater than 0")
        .finite("Amount must be a valid finite number"),
    idempotencyKey: z.string({ required_error: "idempotencyKey is required" })
        .trim()
        .min(1, "idempotencyKey cannot be empty")
        .max(128, "idempotencyKey is too long")
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    transferSchema,
    initialFundsSchema
};

