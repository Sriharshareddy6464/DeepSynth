from flask import jsonify


def json_success(payload=None, status=200):
    response = {"success": True}
    if payload:
        response.update(payload)
    return jsonify(response), status


def json_error(message, status=400, **extra):
    response = {"success": False, "error": message}
    if extra:
        response.update(extra)
    return jsonify(response), status
