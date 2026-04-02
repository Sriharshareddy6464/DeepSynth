from backend.utils.response import json_success


def register_health_routes(app):
    @app.route("/")
    @app.route("/api/health")
    def healthcheck():
        return json_success(
            {
                "service": "DeepSynth API",
                "ui": "React frontend",
                "status": "ok",
            }
        )
