"""Keep every test run away from the real finance databases.

Importing ``app.main`` and entering ``TestClient(app)`` runs the app's startup
(schema changes, data repairs, Gmail balance refresh) against
``app.database.engine``. Without this file that engine points at the personal
``data/finance.db`` -- or at whatever ``FINANCE_DB_URL`` is set to in the shell,
which may be the cloud database. These environment variables are applied
before any test module imports ``app``, and they override existing values on
purpose.
"""

from __future__ import annotations

import hashlib
import os
import sys
import tempfile
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
REAL_DATA_DIR = BACKEND_DIR.parent / "data"
REAL_DB_FILES = [REAL_DATA_DIR / "finance.db", REAL_DATA_DIR / "demo.db"]

_TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="finance-home-tests-"))
os.environ["FINANCE_DATA_DIR"] = str(_TEST_DATA_DIR)
os.environ["FINANCE_DB_URL"] = f"sqlite:///{(_TEST_DATA_DIR / 'test.db').as_posix()}"
os.environ["APP_MODE"] = "personal"

# Allow `pytest backend/tests` from the repository root as well as `pytest tests`
# from inside backend/.
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _fingerprint(path: Path) -> tuple[bool, str | None, int | None]:
    if not path.exists():
        return (False, None, None)
    return (True, hashlib.sha256(path.read_bytes()).hexdigest(), path.stat().st_mtime_ns)


@pytest.fixture(scope="session", autouse=True)
def real_databases_untouched():
    """Fail the run if any real database file was created, modified or removed."""
    from app import database

    assert database.DATA_DIR.resolve() == _TEST_DATA_DIR.resolve()
    assert str(_TEST_DATA_DIR.as_posix()) in database.DATABASE_URL

    before = {path: _fingerprint(path) for path in REAL_DB_FILES}
    yield
    after = {path: _fingerprint(path) for path in REAL_DB_FILES}
    changed = [str(path) for path in REAL_DB_FILES if before[path] != after[path]]
    assert not changed, f"Tests modified real database files: {changed}"
