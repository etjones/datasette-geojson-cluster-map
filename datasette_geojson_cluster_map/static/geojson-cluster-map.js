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

    // Customize the map.
    // Add a metric/imperial distance scale
    L.control.scale().addTo(map);

    // Add a legend to the map. This is just a demo for now; 
    // TODO: We'd like some way to dynamically create the legend from
    // the content of the geojson we're drawing.

    // // blue, from 25% saturation to 100% saturation
    // const colors = [
    //     "#60609f", "#5656a9", "#4d4db2", "#4343bc", "#3a3ac5",
    //     "#3030cf", "#2626d9", "#1d1de2", "#1313ec", "#0a0af5", "#0000ff",
    // ];

    // const labels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    // addColorKey(map, colors, labels);

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

// colors: array of color strings, e.g. ["#60609f", "#5b5ba4", ...]
// labels: array of label strings, e.g. ["0", "5", "10", ...]
function addColorKey(map, colors, labels, title = "Legend") {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML += `<div style="font-weight:bold; margin-bottom:4px;">${title}</div>`;
        for (let i = 0; i < colors.length; i++) {
            div.innerHTML +=
                `<i style="background:${colors[i]}; width:18px; height:18px; display:inline-block; margin-right:8px; border:1px solid #333; vertical-align:middle;"></i>` +
                `<span style="vertical-align:middle;">${labels[i]}</span><br>`;
        }
        return div;
    };

    legend.addTo(map);
}