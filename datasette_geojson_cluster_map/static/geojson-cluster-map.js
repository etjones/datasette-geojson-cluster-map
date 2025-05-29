// datasette-geojson-cluster-map: overlays GeoJSON on an existing datasette-cluster-map
const geojsonTypes = new Set([
    "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon",
    "MultiPolygon", "GeometryCollection", "Feature", "FeatureCollection"
]);

document.addEventListener("DOMContentLoaded", async function () {
    // make sure leaflet is loaded
    const L = await waitForLeaflet();

    // Try to find an existing datasette-cluster-map instance
    const map = await getClusterMapInstance();
    if (!map) {
        // Bail if we can't get or create a map
        return;
    }

    // --- GeoJSON overlay logic ---
    // Find table rows and scan for GeoJSON columns
    const geojsonColumns = getGeoJsonColumns();
    if (!geojsonColumns.length) return;

    const path = getQueryPath(this.location);

    // add all the geoJSON to the map
    loadMarkers(path, map, geojsonColumns, 0);

});

const getClusterMapInstance = async () => {
    // # FIXME: this would break if more than one map were defined on the page
    const mapDiv = await waitForSelector(".leaflet-container");
    // let mapDiv = document.querySelector(".leaflet-container");
    if (mapDiv && mapDiv.datasetteClusterMap) {
        const map = mapDiv.datasetteClusterMap
        return mapDiv.datasetteClusterMap;
    }
    // No map found: this plugin is a no-op without the cluster map's data
    console.log("No datasette-cluster-map map instance found. ")

    return null;
};

const getGeoJsonColumns = () => {
    let columns = Array.prototype.map.call(
        document.querySelectorAll("table.rows-and-columns th"),
        (th) => (th.getAttribute("data-column") || th.textContent).trim()
    );

    // Only enable GeoJSON detection if the opt-in flag is true
    let geojsonColumns = [];

    columns.forEach((col, idx) => {
        // Find first non-empty cell in this column
        let cell = document.querySelector(`table.rows-and-columns td:nth-child(${idx + 1})`);
        if (cell && cell.innerText.trim()) {
            try {
                let val = cell.innerText.trim();
                let parsed = JSON.parse(val);
                if (parsed && typeof parsed === "object" && parsed.type && geojsonTypes.has(parsed.type)) {
                    geojsonColumns.push(col);
                }
            } catch (e) { }
        }
    });

    return geojsonColumns;
}

const loadMarkers = (path, map, geojsonColumns, count) => {
    count = count || 0;

    const geojsonStyle = {
        color: '#ff7800',
        weight: 2,
        opacity: 0.65
    };

    return fetch(path)
        .then((r) => r.json())
        .then((data) => {
            let geojsonLayers = [];
            data.rows.forEach((row) => {

                geojsonColumns.forEach(col => {
                    let val = row[col];
                    if (val) {
                        try {
                            let parsed = typeof val === "string" ? JSON.parse(val) : val;
                            if (parsed && typeof parsed === "object" && parsed.type && geojsonTypes.has(parsed.type)) {
                                // // TODO: If our geoJSON has a className defined in properties, 
                                // // add it to the style of the object we create.
                                // // This will allow us to apply styles externally
                                // let style = { ...geojsonStyle };
                                // if (parsed.properties && parsed.properties.className) {
                                //     style.className = parsed.properties.className;
                                // }

                                let layer = L.geoJSON(parsed, { style: geojsonStyle });
                                geojsonLayers.push(layer);
                            }
                        } catch (e) { }
                    }
                });
            });
            // Add GeoJSON overlays to map
            geojsonLayers.forEach(layer => layer.addTo(map));
            // console.log(`Added ${geojsonLayers.length} geoJson layers to map`);
        });
}

const getQueryPath = (location) => {
    let path = location.pathname + ".json" + location.search;
    const qs = "_size=max&_labels=on&_extra=count&_extra=next_url&_shape=objects";
    if (path.indexOf("?") > -1) {
        path += "&" + qs;
    } else {
        path += "?" + qs;
    }
    return path;
};

async function waitForLeaflet(maxAttempts = 200, intervalMs = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        if (window.L) {
            return window.L;
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error("Leaflet (window.L) not loaded");
}

async function waitForSelector(selector, timeoutMs = 2000, intervalMs = 100) {
    const start = Date.now();
    return new Promise((resolve) => {
        function check() {
            const el = document.querySelector(selector);
            if (el) {
                resolve(el);
            } else if (Date.now() - start >= timeoutMs) {
                resolve(null);
            } else {
                setTimeout(check, intervalMs);
            }
        }
        check();
    });
}