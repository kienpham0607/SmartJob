export class ApiError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed')
    return res
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'Nội dung JSON không hợp lệ.' } });
  if (error.type === 'entity.too.large')
    return res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Nội dung yêu cầu vượt quá 100 KB.' } });
  if (error.name === 'ZodError')
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ.',
        details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
  if (error.code === 11000)
    return res.status(409).json({
      error: {
        code: error.keyPattern?.email ? 'EMAIL_EXISTS' : 'DUPLICATE',
        message: error.keyPattern?.email
          ? 'Email đã được sử dụng.'
          : 'Bạn đã ứng tuyển công việc này.',
      },
    });
  if (error.name === 'CastError' || error.name === 'ValidationError')
    return res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ.' } });
  const status = error.status || 500;
  if (status >= 500) console.error(`[${req.method} ${req.path}]`, error.message);
  const message =
    status >= 500 && !(error instanceof ApiError)
      ? 'Máy chủ gặp lỗi. Vui lòng thử lại.'
      : error.message;
  res.status(status).json({ error: { code: error.code || 'SERVER_ERROR', message } });
}
