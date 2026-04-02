from flask import request
from flask_login import current_user, login_user, logout_user

from backend.models.db_models import User, db
from backend.utils.response import json_error, json_success


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


def configure_login_manager(login_manager):
    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return json_error("Authentication required", status=401)


def register_auth_routes(app):
    @app.route("/api/register", methods=["POST"])
    @app.route("/api/signup", methods=["POST"])
    def register():
        if not request.is_json:
            return json_error("Expected application/json request body", status=415)

        data = request.get_json(silent=True) or {}
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not username or not email or not password:
            return json_error("Username, email, and password are required", status=400)

        if len(password) < 8:
            return json_error("Password must be at least 8 characters long", status=400)

        if User.query.filter_by(email=email).first():
            return json_error("Email already exists", status=409)

        if User.query.filter_by(username=username).first():
            return json_error("Username already exists", status=409)

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return json_success(
            {
                "message": "Registration successful",
                "user": serialize_user(user),
            },
            status=201,
        )

    @app.route("/api/login", methods=["POST"])
    def login():
        if not request.is_json:
            return json_error("Expected application/json request body", status=415)

        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return json_error("Email and password are required", status=400)

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return json_error("Invalid credentials", status=401)

        login_user(user)
        return json_success({"user": serialize_user(user)})

    @app.route("/api/logout", methods=["POST"])
    def logout():
        if current_user.is_authenticated:
            logout_user()
        return json_success({"message": "Logged out"})

    @app.route("/api/me", methods=["GET"])
    def get_current_user():
        if not current_user.is_authenticated:
            return json_success({"authenticated": False, "user": None})

        return json_success(
            {
                "authenticated": True,
                "user": serialize_user(current_user),
            }
        )
