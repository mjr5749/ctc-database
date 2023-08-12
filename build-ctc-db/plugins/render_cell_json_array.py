from datasette import hookimpl
import json

@hookimpl
def render_cell(row, value, column, table, database, datasette):
    # This plugin will render cell values that are arrays of JSON 
    # strings, as a simple comma-separated list.

    # Skip this cell if the value is not a string
    if not isinstance(value, str):
        return None
    
    # Skip this cell if the string does not start and end with
    # JSON array delimiters []
    stripped = value.strip()
    if not (
        stripped.startswith("[") and stripped.endswith("]")
    ):
        return None

    # Skip this cell if the string does not parse as valid JSON
    try:
        data = json.loads(value)
    except ValueError:
        return None
    
    # Skip this cell if the result of the JSON parsing is not
    # a python list (produced for JSON arrays)
    if not isinstance(data, list):
        return None
    
    # Skip this cell if any of the array elements is not
    # a simple string value
    if any(not isinstance(s, str) for s in data):
        return None

    # At this point, we know the cell is a JSON array consisting
    # of only string values. Render them as a comma-separated
    # list of values.
    return ", ".join(data)

