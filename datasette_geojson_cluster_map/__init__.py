from datasette import hookimpl

ColumnName = str


@hookimpl
def extra_js_urls(database, table, columns, view_name, datasette):
    if not find_geojson_columns(database, table, columns, view_name, datasette):
        return []
    return [
        {
            "url": datasette.urls.static_plugins(
                "datasette_geojson_cluster_map", "geojson-cluster-map.js"
            ),
            "module": True,
        }
    ]


# FIXME: make this valid. Return a names of all columns that contain GeoJSON information
def find_geojson_columns(
    database, table, columns, view_name, datasette
) -> list[ColumnName]:
    return ["geometry"]
