# datasette-geojson-cluster-map

[![PyPI](https://img.shields.io/pypi/v/datasette-geojson-cluster-map.svg)](https://pypi.org/project/datasette-geojson-cluster-map/)
[![Changelog](https://img.shields.io/github/v/release/etjones/datasette-geojson-cluster-map?include_prereleases&label=changelog)](https://github.com/etjones/datasette-geojson-cluster-map/releases)
[![Tests](https://github.com/etjones/datasette-geojson-cluster-map/actions/workflows/test.yml/badge.svg)](https://github.com/etjones/datasette-geojson-cluster-map/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/etjones/datasette-geojson-cluster-map/blob/main/LICENSE)

Draw GeoJSON from a database on the standard Datasette cluster map

## Installation

Install this plugin in the same environment as Datasette.
```bash
datasette install datasette-geojson-cluster-map
```
## Usage

With this plugin installed in your environment, load a datasette table that 
has identifiable latitude/longitude columns, and some valid GeoJSON in another
column. All GeoJSON should be drawn on the same cluster map instance. 


## Development

To set up this plugin locally, first checkout the code. Then create a new virtual environment:
```bash
cd datasette-geojson-cluster-map
python -m venv venv
source venv/bin/activate
```
Now install the dependencies and test dependencies:
```bash
pip install -e '.[test]'
```
To run the tests:
```bash
python -m pytest
```
