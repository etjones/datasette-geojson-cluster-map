import datasette
from datasette_test import wait_until_responds
import pytest
import sqlite3
from subprocess import Popen, PIPE
import sys


def pytest_report_header():
    return "Datasette: {}".format(datasette.__version__)


@pytest.fixture(scope="session")
def ds_server(tmp_path_factory):
    tmpdir = tmp_path_factory.mktemp("tmp")
    db_path = str(tmpdir / "data.db")

    # Describes an X centered at our first point, (37.0167, -122.0024)
    x_geojson = """
    {
    "type": "MultiLineString",
    "coordinates": [
        [
        [-122.0034, 37.0157],
        [-122.0014, 37.0177]
        ],
        [
        [-122.0014, 37.0157],
        [-122.0034, 37.0177]
        ]
    ]
    }
    """

    db = sqlite3.connect(db_path)
    for latitude, longitude, geo_column in (
        ("lat", "lng", "geometry"),
        ("lat", "lng", "arbitrary"),
    ):
        with db:
            table_name = f"{latitude}_{longitude}_{geo_column}"
            db.execute(
                f"""
                create table {table_name} (
                    id integer primary key,
                    {latitude} float,
                    {longitude} float,
                    {geo_column} text
                )
            """
            )
            db.execute(
                f"""
                insert into {table_name} (id, {latitude}, {longitude}, {geo_column})
                values
                    (1, 37.0167, -122.0024, '{x_geojson}'),
                    (2, 37.3184, -121.9511, null)
                """
            )
    process = Popen(
        [
            sys.executable,
            "-m",
            "datasette",
            "--port",
            "8126",
            str(db_path),
        ],
        stdout=PIPE,
    )
    wait_until_responds("http://localhost:8126/")
    yield "http://localhost:8126"
    process.terminate()
    process.wait()
