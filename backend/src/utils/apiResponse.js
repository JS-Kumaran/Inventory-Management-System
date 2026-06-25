class ApiResponse {
    static success(res, message, data = null, statusCode = 200) {
        const response = {
            success: true,
            message,
        };

        if (data) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    static error(res, message, statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    static paginated(res, message, data, pagination, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                pages: pagination.pages,
                nextPage: pagination.nextPage,
                prevPage: pagination.prevPage,
            },
        });
    }
}

module.exports = ApiResponse;