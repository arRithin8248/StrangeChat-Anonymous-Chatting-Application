/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }

        next();
    };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

/**
 * Check if user is moderator or admin
 */
const isModerator = (req, res, next) => {
    if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Moderator access required' });
    }
};

module.exports = { authorize, isAdmin, isModerator };
