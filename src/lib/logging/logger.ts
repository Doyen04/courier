type LogFields = Record<string, unknown>;

function write(level: "info" | "warn" | "error", event: string, fields: LogFields) {
    const record = JSON.stringify({
        ...fields,
        level,
        event,
        timestamp: new Date().toISOString(),
    });

    if (level === "error") {
        console.error(record);
    } else if (level === "warn") {
        console.warn(record);
    } else {
        console.info(record);
    }
}

export function errorFields(error: unknown): LogFields {
    if (!(error instanceof Error)) {
        return { errorName: "UnknownError", errorMessage: String(error), errorCode: null };
    }

    const code = (error as { code?: unknown }).code;
    return {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: typeof code === "string" || typeof code === "number" ? code : null,
    };
}

export const logger = {
    info(event: string, fields: LogFields = {}) {
        write("info", event, fields);
    },
    warn(event: string, fields: LogFields = {}) {
        write("warn", event, fields);
    },
    error(event: string, fields: LogFields = {}) {
        write("error", event, fields);
    },
};
