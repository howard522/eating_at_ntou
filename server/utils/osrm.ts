export interface OsrmRouteResult {
    distance: number;
    duration: number;
}

export async function getOsrmRoute(start: [number, number], end: [number, number]) {
    const baseUrl = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
    const coordinates = `${start[0]},${start[1]};${end[0]},${end[1]}`;
    const url = `${baseUrl.replace(/\/$/, "")}/route/v1/driving/${coordinates}?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
        throw createError({
            statusCode: 502,
            statusMessage: "Bad Gateway",
            message: `OSRM request failed with status ${response.status}.`,
        });
    }

    const data = (await response.json()) as {
        code?: string;
        routes?: OsrmRouteResult[];
        message?: string;
    };

    if (data.code !== "Ok" || !data.routes?.length) {
        throw createError({
            statusCode: 502,
            statusMessage: "Bad Gateway",
            message: data.message || "OSRM did not return a valid route.",
        });
    }

    return data.routes[0];
}