export enum HttpStatus {
    Continue = 100,
    SwitchingProtocols = 101,
    Processing = 102,
    EarlyHints = 103,

    OK = 200,
    Created = 201,
    Accepted = 202,
    NonAuthoritativeInformation = 203,
    NoContent = 204,
    ResetContent = 205,
    PartialContent = 206,
    MultiStatus = 207,
    AlreadyReported = 208,
    IMUsed = 226,

    MultipleChoices = 300,
    MovedPermanently = 301,
    Found = 302,
    SeeOther = 303,
    NotModified = 304,
    UseProxy = 305,
    TemporaryRedirect = 307,
    PermanentRedirect = 308,

    BadRequest = 400,
    Unauthorized = 401,
    PaymentRequired = 402,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    NotAcceptable = 406,
    ProxyAuthenticationRequired = 407,
    RequestTimeout = 408,
    Conflict = 409,
    Gone = 410,
    LengthRequired = 411,
    PreconditionFailed = 412,
    ContentTooLarge = 413,
    URITooLong = 414,
    UnsupportedMediaType = 415,
    RangeNotSatisfiable = 416,
    ExpectationFailed = 417,
    ImATeapot = 418,
    MisdirectedRequest = 421,
    UnprocessableContent = 422,
    Locked = 423,
    FailedDependency = 424,
    TooEarly = 425,
    UpgradeRequired = 426,
    PreconditionRequired = 428,
    TooManyRequests = 429,
    RequestHeaderFieldsTooLarge = 431,
    UnavailableForLegalReasons = 451,

    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
    GatewayTimeout = 504,
    HTTPVersionNotSupported = 505,
    VariantAlsoNegotiates = 506,
    InsufficientStorage = 507,
    LoopDetected = 508,
    NotExtended = 510,
    NetworkAuthenticationRequired = 511,
}

export const HttpStatusMessage = {
    [HttpStatus.Continue]: "Continue", // 100
    [HttpStatus.SwitchingProtocols]: "Switching Protocols", // 101
    [HttpStatus.Processing]: "Processing", // 102
    [HttpStatus.EarlyHints]: "Early Hints", // 103

    [HttpStatus.OK]: "OK", // 200
    [HttpStatus.Created]: "Created", // 201
    [HttpStatus.Accepted]: "Accepted", // 202
    [HttpStatus.NonAuthoritativeInformation]: "Non-Authoritative Information", // 203
    [HttpStatus.NoContent]: "No Content", // 204
    [HttpStatus.ResetContent]: "Reset Content", // 205
    [HttpStatus.PartialContent]: "Partial Content", // 206
    [HttpStatus.MultiStatus]: "Multi-Status", // 207
    [HttpStatus.AlreadyReported]: "Already Reported", // 208
    [HttpStatus.IMUsed]: "IM Used", // 226

    [HttpStatus.MultipleChoices]: "Multiple Choices", // 300
    [HttpStatus.MovedPermanently]: "Moved Permanently", // 301
    [HttpStatus.Found]: "Found", // 302
    [HttpStatus.SeeOther]: "See Other", // 303
    [HttpStatus.NotModified]: "Not Modified", // 304
    [HttpStatus.UseProxy]: "Use Proxy", // 305
    [HttpStatus.TemporaryRedirect]: "Temporary Redirect", // 307
    [HttpStatus.PermanentRedirect]: "Permanent Redirect", // 308

    [HttpStatus.BadRequest]: "Bad Request", // 400
    [HttpStatus.Unauthorized]: "Unauthorized", // 401
    [HttpStatus.PaymentRequired]: "Payment Required", // 402
    [HttpStatus.Forbidden]: "Forbidden", // 403
    [HttpStatus.NotFound]: "Not Found", // 404
    [HttpStatus.MethodNotAllowed]: "Method Not Allowed", // 405
    [HttpStatus.NotAcceptable]: "Not Acceptable", // 406
    [HttpStatus.ProxyAuthenticationRequired]: "Proxy Authentication Required", // 407
    [HttpStatus.RequestTimeout]: "Request Timeout", // 408
    [HttpStatus.Conflict]: "Conflict", // 409
    [HttpStatus.Gone]: "Gone", // 410
    [HttpStatus.LengthRequired]: "Length Required", // 411
    [HttpStatus.PreconditionFailed]: "Precondition Failed", // 412
    [HttpStatus.ContentTooLarge]: "Content Too Large", // 413
    [HttpStatus.URITooLong]: "URI Too Long", // 414
    [HttpStatus.UnsupportedMediaType]: "Unsupported Media Type", // 415
    [HttpStatus.RangeNotSatisfiable]: "Range Not Satisfiable", // 416
    [HttpStatus.ExpectationFailed]: "Expectation Failed", // 417
    [HttpStatus.ImATeapot]: "I'm a teapot", // 418
    [HttpStatus.MisdirectedRequest]: "Misdirected Request", // 421
    [HttpStatus.UnprocessableContent]: "Unprocessable Content", // 422
    [HttpStatus.Locked]: "Locked", // 423
    [HttpStatus.FailedDependency]: "Failed Dependency", // 424
    [HttpStatus.TooEarly]: "Too Early", // 425
    [HttpStatus.UpgradeRequired]: "Upgrade Required", // 426
    [HttpStatus.PreconditionRequired]: "Precondition Required", // 428
    [HttpStatus.TooManyRequests]: "Too Many Requests", // 429
    [HttpStatus.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large", // 431
    [HttpStatus.UnavailableForLegalReasons]: "Unavailable For Legal Reasons", // 451

    [HttpStatus.InternalServerError]: "Internal Server Error", // 500
    [HttpStatus.NotImplemented]: "Not Implemented", // 501
    [HttpStatus.BadGateway]: "Bad Gateway", // 502
    [HttpStatus.ServiceUnavailable]: "Service Unavailable", // 503
    [HttpStatus.GatewayTimeout]: "Gateway Timeout", // 504
    [HttpStatus.HTTPVersionNotSupported]: "HTTP Version Not Supported", // 505
    [HttpStatus.VariantAlsoNegotiates]: "Variant Also Negotiates", // 506
    [HttpStatus.InsufficientStorage]: "Insufficient Storage", // 507
    [HttpStatus.LoopDetected]: "Loop Detected", // 508
    [HttpStatus.NotExtended]: "Not Extended", // 510
    [HttpStatus.NetworkAuthenticationRequired]: "Network Authentication Required", // 511
};
