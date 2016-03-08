/**
 * MIME types
 */
export const MIME_TYPE_APPLICATION_JSON = 'application/json';
export const MIME_TYPE_TEXT_HTML = 'text/html';
export const MIME_TYPE_TEXT_PLAIN = 'text/plain';

/**
 * Character encodings
 */
export const ENCODING_UTF_8 = 'UTF-8';

/**
 * Header values
 */
export const OUTBOUND_SERVER_HEADER = 'XublitRestServer/v1';

/**
 * HTTP/1.1 Status Codes
 */
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_ACCEPTED = 202;
export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_INTERNAL_ERROR = 500;

/**
 * HTTP/1.1 Header names
 */
export const HTTP_HEADER_ACCEPT = 'Accept';
export const HTTP_HEADER_ACCEPT_VERSION = 'Accept-Version';
export const HTTP_HEADER_CONTENT_TYPE = 'Content-Type';

/**
 * HTTP/1.1 Methods
 */
export const HTTP_METHOD_OPTIONS = 'OPTIONS';
export const HTTP_METHOD_GET = 'GET';
export const HTTP_METHOD_POST = 'POST';
export const HTTP_METHOD_PATCH = 'PATCH';
export const HTTP_METHOD_PUT = 'PUT';
export const HTTP_METHOD_DELETE = 'DELETE';
export const HTTP_METHOD_HEAD = 'HEAD';

/**
 * HTTP/1.1 Method types
 */
export const ALL_HTTP_METHODS = [
    HTTP_METHOD_OPTIONS,
    HTTP_METHOD_GET,
    HTTP_METHOD_POST,
    HTTP_METHOD_PATCH,
    HTTP_METHOD_PUT,
    HTTP_METHOD_DELETE,
    HTTP_METHOD_HEAD,
];
export const HTTP_READ_METHODS = [
    HTTP_METHOD_OPTIONS,
    HTTP_METHOD_GET,
    HTTP_METHOD_HEAD,
];
export const HTTP_WRITE_METHODS = [
    HTTP_METHOD_POST,
    HTTP_METHOD_PATCH,
    HTTP_METHOD_PUT,
    HTTP_METHOD_DELETE,
];
