exports.verifyStudent = (req, res, next) => {

    if (!req.session || !req.session.studentId) {
        return res.status(401).json({
            success: false,
            message: 'Please login first'
        });
    }

    next();
};