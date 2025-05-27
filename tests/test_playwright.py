import pytest

try:
    from playwright import sync_api
except ImportError:
    sync_api = None
import nest_asyncio

nest_asyncio.apply()

pytestmark = pytest.mark.skipif(sync_api is None, reason="playwright not installed")


@pytest.mark.parametrize("table", ("lat_lng_geometry", "lat_lng_arbitrary"))
def test_geojson_overlay_rendering(ds_server, table, page):
    """
    We assume a table named 'lat_lng' exists with a column containing valid GeoJSON.
    (It's created in conftest.py)
    """
    url = ds_server + f"/data/{table}"
    page.goto(url)
    # Count SVG overlays (GeoJSON); we should see one regardless of table & column names
    sync_api.expect(page.locator("svg .leaflet-interactive")).to_have_count(1)
