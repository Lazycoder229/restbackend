const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * FileUpload class
 * Provides lightweight middleware for handling multipart/form-data uploads
 * in an Express-like environment without using external libraries.
 */
class FileUpload {
  constructor(options = {}) {
    // Directory where uploaded files will be saved
    this.dest = options.dest || "./uploads";

    // Configuration limits for file size and file count
    this.limits = {
      fileSize: options.limits?.fileSize || 10 * 1024 * 1024, // Default: 10MB
      files: options.limits?.files || 10, // Default: 10 files per upload
    };

    // Optional file filter function for validating uploads
    this.fileFilter = options.fileFilter || (() => true);

    // Ensure upload directory exists
    if (!fs.existsSync(this.dest)) {
      fs.mkdirSync(this.dest, { recursive: true });
    }
  }

  /**
   * Parses multipart/form-data requests manually without external dependencies.
   * Extracts both text fields and file uploads from the incoming HTTP request.
   */
  parseMultipart(req) {
    return new Promise((resolve, reject) => {
      const contentType = req.headers["content-type"];
      if (!contentType || !contentType.includes("multipart/form-data")) {
        // If not multipart, return empty result
        return resolve({ fields: {}, files: [] });
      }

      const boundary = contentType.split("boundary=")[1];
      if (!boundary) {
        return reject(new Error("No boundary found"));
      }

      let buffer = Buffer.alloc(0);
      const fields = {};
      const files = [];

      // Accumulate the incoming request data
      req.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      });

      // Process data when fully received
      req.on("end", () => {
        const parts = this.splitByBoundary(buffer, boundary);

        parts.forEach((part) => {
          if (part.length === 0) return;

          const { headers, body } = this.parsePart(part);
          const disposition = headers["content-disposition"];

          if (!disposition) return;

          const nameMatch = disposition.match(/name="([^"]+)"/);
          const filenameMatch = disposition.match(/filename="([^"]+)"/);

          if (filenameMatch) {
            // ===== Handle File Upload =====
            const filename = filenameMatch[1];
            const fieldname = nameMatch ? nameMatch[1] : "file";

            // Check file count and size limits
            if (files.length >= this.limits.files) {
              return reject(new Error("Too many files"));
            }

            if (body.length > this.limits.fileSize) {
              return reject(new Error("File too large"));
            }

            // Generate a secure random filename to avoid collisions
            const ext = path.extname(filename);
            const newFilename = crypto.randomBytes(16).toString("hex") + ext;
            const filepath = path.join(this.dest, newFilename);

            try {
              // Write file to disk
              fs.writeFileSync(filepath, body);

              files.push({
                fieldname,
                originalname: filename,
                filename: newFilename,
                path: filepath,
                size: body.length,
                mimetype: headers["content-type"] || "application/octet-stream",
              });
            } catch (err) {
              return reject(err);
            }
          } else if (nameMatch) {
            // ===== Handle Text Field =====
            fields[nameMatch[1]] = body.toString("utf8");
          }
        });

        resolve({ fields, files });
      });

      req.on("error", reject);
    });
  }

  /**
   * Splits multipart/form-data content into individual parts
   * based on the boundary string specified in the Content-Type header.
   */
  splitByBoundary(buffer, boundary) {
    const parts = [];
    const delimiter = Buffer.from(`--${boundary}`);
    let start = 0;

    while (start < buffer.length) {
      const pos = buffer.indexOf(delimiter, start);
      if (pos === -1) break;

      if (start !== 0) {
        parts.push(buffer.slice(start, pos));
      }

      start = pos + delimiter.length;

      // Skip CRLF after boundary
      if (buffer[start] === 13 && buffer[start + 1] === 10) {
        start += 2;
      }
    }

    return parts;
  }

  /**
   * Parses a single multipart section into headers and body.
   * Each section may represent either a form field or a file upload.
   */
  parsePart(buffer) {
    // Find separator between headers and body
    const separatorPos = buffer.indexOf("\r\n\r\n");

    if (separatorPos === -1) {
      return { headers: {}, body: buffer };
    }

    const headerSection = buffer.slice(0, separatorPos).toString("utf8");
    const body = buffer.slice(separatorPos + 4, buffer.length - 2); // Remove trailing CRLF

    const headers = {};
    headerSection.split("\r\n").forEach((line) => {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        headers[key.trim().toLowerCase()] = valueParts.join(":").trim();
      }
    });

    return { headers, body };
  }

  /**
   * Middleware for handling a single file upload.
   * Stores file in req.file and text fields in req.body.
   */
  single(fieldname) {
    return async (req, res, next) => {
      try {
        const { fields, files } = await this.parseMultipart(req);
        req.body = fields;
        req.file = files.find((f) => f.fieldname === fieldname);
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  /**
   * Middleware for handling multiple uploads under the same field name.
   * Stores files in req.files and text fields in req.body.
   */
  array(fieldname, maxCount) {
    return async (req, res, next) => {
      try {
        const { fields, files } = await this.parseMultipart(req);
        req.body = fields;
        req.files = files
          .filter((f) => f.fieldname === fieldname)
          .slice(0, maxCount);
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  /**
   * Middleware for accepting any number of uploaded files
   * regardless of field names. Stores files in req.files.
   */
  any() {
    return async (req, res, next) => {
      try {
        const { fields, files } = await this.parseMultipart(req);
        req.body = fields;
        req.files = files;
        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

/**
 * Factory function that creates a new FileUpload instance
 * with the provided options for easy middleware usage.
 */
function upload(options) {
  return new FileUpload(options);
}

module.exports = upload;

/**
 * This module provides middleware for handling file uploads in custom
 * Express-like frameworks. It parses multipart/form-data requests,
 * saves uploaded files to a destination directory, and exposes
 * parsed data (fields and files) on the request object.
 *
 * Features:
 * - Supports single, multiple, or any number of uploads.
 * - Generates unique filenames using crypto to avoid conflicts.
 * - Enforces upload limits (file size, file count).
 * - Allows custom file filtering through user-defined functions.
 * - Automatically creates upload directories if missing.
 *
 * Main methods:
 * - single(fieldname): Accepts one file for a specific field.
 * - array(fieldname, maxCount): Accepts multiple files for one field.
 * - any(): Accepts all uploaded files from the request.
 */
